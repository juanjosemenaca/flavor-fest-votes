-- Keep public vote lock after submission, but allow admins full override.

DROP POLICY IF EXISTS "Anyone can insert votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can update votes" ON public.votes;
DROP POLICY IF EXISTS "Anyone can delete votes" ON public.votes;

CREATE POLICY "Anyone can insert votes"
ON public.votes
FOR INSERT
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (
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
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.access_codes ac
    WHERE ac.id = votes.access_code_id
      AND ac.used = false
  )
)
WITH CHECK (
  public.is_admin(auth.uid())
  OR EXISTS (
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
  public.is_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.access_codes ac
    WHERE ac.id = votes.access_code_id
      AND ac.used = false
  )
);
