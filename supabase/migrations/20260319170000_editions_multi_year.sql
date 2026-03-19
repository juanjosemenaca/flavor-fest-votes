-- Editions: one row per year (2026, 2027, ...)
CREATE TABLE public.editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL UNIQUE,
  contest_name TEXT NOT NULL DEFAULT 'AITORTILLA',
  voting_open BOOLEAN NOT NULL DEFAULT true,
  results_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read editions" ON public.editions FOR SELECT USING (true);
CREATE POLICY "Admins can manage editions" ON public.editions FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_editions_updated_at
  BEFORE UPDATE ON public.editions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate contest_settings to editions (year 2026)
INSERT INTO public.editions (year, contest_name, voting_open, results_published)
VALUES (
  2026,
  COALESCE((SELECT contest_name FROM public.contest_settings LIMIT 1), 'AITORTILLA'),
  COALESCE((SELECT voting_open FROM public.contest_settings LIMIT 1), true),
  COALESCE((SELECT results_published FROM public.contest_settings LIMIT 1), false)
);

-- Add edition_id to categories
ALTER TABLE public.categories ADD COLUMN edition_id UUID REFERENCES public.editions(id) ON DELETE CASCADE;
UPDATE public.categories SET edition_id = (SELECT id FROM public.editions WHERE year = 2026 LIMIT 1);
ALTER TABLE public.categories ALTER COLUMN edition_id SET NOT NULL;

-- Add edition_id to dishes
ALTER TABLE public.dishes ADD COLUMN edition_id UUID REFERENCES public.editions(id) ON DELETE CASCADE;
UPDATE public.dishes SET edition_id = (SELECT id FROM public.editions WHERE year = 2026 LIMIT 1);
ALTER TABLE public.dishes ALTER COLUMN edition_id SET NOT NULL;

-- Add edition_id to attendees
ALTER TABLE public.attendees ADD COLUMN edition_id UUID REFERENCES public.editions(id) ON DELETE CASCADE;
UPDATE public.attendees SET edition_id = (SELECT id FROM public.editions WHERE year = 2026 LIMIT 1);
ALTER TABLE public.attendees ALTER COLUMN edition_id SET NOT NULL;

-- Add edition_id to participant_teams; team_number resets per edition
ALTER TABLE public.participant_teams ADD COLUMN edition_id UUID REFERENCES public.editions(id) ON DELETE CASCADE;
UPDATE public.participant_teams SET edition_id = (SELECT id FROM public.editions WHERE year = 2026 LIMIT 1);
ALTER TABLE public.participant_teams ALTER COLUMN edition_id SET NOT NULL;
ALTER TABLE public.participant_teams ALTER COLUMN team_number DROP IDENTITY;
ALTER TABLE public.participant_teams DROP CONSTRAINT IF EXISTS participant_teams_team_number_key;
ALTER TABLE public.participant_teams ADD CONSTRAINT participant_teams_edition_team_number_key UNIQUE (edition_id, team_number);
CREATE OR REPLACE FUNCTION public.set_team_number_for_edition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.team_number IS NULL THEN
    SELECT COALESCE(MAX(team_number),0)+1 INTO NEW.team_number FROM public.participant_teams WHERE edition_id = NEW.edition_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER set_team_number_trigger BEFORE INSERT ON public.participant_teams FOR EACH ROW EXECUTE FUNCTION public.set_team_number_for_edition();

-- Add edition_id to access_codes; allow same code in different years
ALTER TABLE public.access_codes ADD COLUMN edition_id UUID REFERENCES public.editions(id) ON DELETE CASCADE;
UPDATE public.access_codes SET edition_id = (SELECT id FROM public.editions WHERE year = 2026 LIMIT 1);
ALTER TABLE public.access_codes ALTER COLUMN edition_id SET NOT NULL;
ALTER TABLE public.access_codes DROP CONSTRAINT IF EXISTS access_codes_code_key;
ALTER TABLE public.access_codes ADD CONSTRAINT access_codes_edition_code_key UNIQUE (edition_id, code);

-- Add edition_id to vote_adjustments
ALTER TABLE public.vote_adjustments ADD COLUMN edition_id UUID REFERENCES public.editions(id) ON DELETE CASCADE;
UPDATE public.vote_adjustments SET edition_id = (SELECT id FROM public.editions WHERE year = 2026 LIMIT 1);
ALTER TABLE public.vote_adjustments ALTER COLUMN edition_id SET NOT NULL;

-- Add edition_id to votes (for direct filtering)
ALTER TABLE public.votes ADD COLUMN edition_id UUID REFERENCES public.editions(id) ON DELETE CASCADE;
UPDATE public.votes SET edition_id = (SELECT id FROM public.editions WHERE year = 2026 LIMIT 1);
ALTER TABLE public.votes ALTER COLUMN edition_id SET NOT NULL;
