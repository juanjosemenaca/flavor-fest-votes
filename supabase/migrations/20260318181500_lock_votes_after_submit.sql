-- Once a code has been used (used = true), votes cannot be edited again.
-- This enforces "no rectification after sending votes" at database level.

DROP POLICY IF EXISTS "Anyone can insert votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can update votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can delete votes" ON public.votes;

CREATE POLICY "Anyone can insert votes"
ON public.votes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.access_codes ac
    WHERE ac.id = access_code_id
      AND ac.used = false
  )
);

CREATE POLICY "Anyone can update votes"
ON public.votes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.access_codes ac
    WHERE ac.id = votes.access_code_id
      AND ac.used = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.access_codes ac
    WHERE ac.id = access_code_id
      AND ac.used = false
  )
);

CREATE POLICY "Anyone can delete votes"
ON public.votes
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.access_codes ac
    WHERE ac.id = votes.access_code_id
      AND ac.used = false
  )
);
