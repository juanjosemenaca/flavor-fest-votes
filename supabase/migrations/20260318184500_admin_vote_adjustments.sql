-- Admin-only manual vote adjustments per dish/category.
-- Allows moderators to add/remove votes without changing voter submissions.

CREATE TABLE public.vote_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dish_id, category_id)
);

ALTER TABLE public.vote_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read vote adjustments"
ON public.vote_adjustments
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage vote adjustments"
ON public.vote_adjustments
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER update_vote_adjustments_updated_at
BEFORE UPDATE ON public.vote_adjustments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.adjust_vote_delta(_dish_id uuid, _category_id uuid, _delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_total integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can adjust votes';
  END IF;

  IF _delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Delta must be -1 or 1';
  END IF;

  INSERT INTO public.vote_adjustments (dish_id, category_id, delta)
  VALUES (_dish_id, _category_id, _delta)
  ON CONFLICT (dish_id, category_id)
  DO UPDATE
  SET delta = public.vote_adjustments.delta + EXCLUDED.delta,
      updated_at = now();

  SELECT delta INTO _new_total
  FROM public.vote_adjustments
  WHERE dish_id = _dish_id AND category_id = _category_id;

  IF _new_total = 0 THEN
    DELETE FROM public.vote_adjustments
    WHERE dish_id = _dish_id AND category_id = _category_id;
    RETURN 0;
  END IF;

  RETURN _new_total;
END;
$$;
