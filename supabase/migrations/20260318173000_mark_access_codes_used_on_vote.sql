-- Mark access codes as used when they submit at least one vote.
-- Also backfill existing votes so admin panel reflects current usage.

CREATE OR REPLACE FUNCTION public.mark_access_code_used_from_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.access_codes
  SET used = true
  WHERE id = NEW.access_code_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mark_access_code_used_after_vote ON public.votes;

CREATE TRIGGER mark_access_code_used_after_vote
AFTER INSERT OR UPDATE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.mark_access_code_used_from_vote();

-- Backfill previously cast votes.
UPDATE public.access_codes ac
SET used = true
WHERE EXISTS (
  SELECT 1
  FROM public.votes v
  WHERE v.access_code_id = ac.id
);
