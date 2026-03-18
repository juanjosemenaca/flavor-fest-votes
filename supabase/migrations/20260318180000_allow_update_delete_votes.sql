-- Allow vote edits for the "Enviar votos" flow.
-- We already allow INSERT/SELECT for public voting; now we also need UPDATE/DELETE.

CREATE POLICY "Anyone can update votes"
ON public.votes
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete votes"
ON public.votes
FOR DELETE
USING (true);
