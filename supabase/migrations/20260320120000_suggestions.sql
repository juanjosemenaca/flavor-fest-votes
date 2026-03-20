-- Buzón de sugerencias: insert público (anon), lectura y borrado solo admin

CREATE TABLE public.suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body TEXT NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a suggestion"
  ON public.suggestions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read suggestions"
  ON public.suggestions
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete suggestions"
  ON public.suggestions
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

COMMENT ON TABLE public.suggestions IS 'Feedback público; solo admins ven los mensajes.';
