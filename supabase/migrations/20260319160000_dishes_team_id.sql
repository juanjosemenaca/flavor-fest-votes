ALTER TABLE public.dishes
ADD COLUMN team_id UUID REFERENCES public.participant_teams(id) ON DELETE SET NULL;
