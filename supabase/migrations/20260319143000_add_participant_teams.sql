CREATE TABLE public.participant_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_number BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.participant_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read participant teams"
  ON public.participant_teams
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert participant teams"
  ON public.participant_teams
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update participant teams"
  ON public.participant_teams
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete participant teams"
  ON public.participant_teams
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE TRIGGER update_participant_teams_updated_at
  BEFORE UPDATE ON public.participant_teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.participant_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.participant_teams(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, attendee_id)
);

ALTER TABLE public.participant_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read team members"
  ON public.participant_team_members
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert team members"
  ON public.participant_team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update team members"
  ON public.participant_team_members
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete team members"
  ON public.participant_team_members
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));
