-- Update adjust_vote_delta to include edition_id (from dish)
CREATE OR REPLACE FUNCTION public.adjust_vote_delta(_dish_id uuid, _category_id uuid, _delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _edition_id uuid;
  _new_total integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can adjust votes';
  END IF;

  IF _delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Delta must be -1 or 1';
  END IF;

  SELECT edition_id INTO _edition_id FROM public.dishes WHERE id = _dish_id LIMIT 1;
  IF _edition_id IS NULL THEN
    RAISE EXCEPTION 'Dish not found or has no edition';
  END IF;

  INSERT INTO public.vote_adjustments (dish_id, category_id, edition_id, delta)
  VALUES (_dish_id, _category_id, _edition_id, _delta)
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
