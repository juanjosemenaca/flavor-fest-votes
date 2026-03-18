
-- Create admin role system
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- RLS for user_roles
CREATE POLICY "Admins can read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Tighten categories: only admins
DROP POLICY "Auth users can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update categories" ON public.categories FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Tighten dishes: only admins
DROP POLICY "Auth users can manage dishes" ON public.dishes;
CREATE POLICY "Admins can manage dishes" ON public.dishes FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update dishes" ON public.dishes FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete dishes" ON public.dishes FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Tighten access_codes: only admins
DROP POLICY "Auth users can manage codes" ON public.access_codes;
CREATE POLICY "Admins can manage codes" ON public.access_codes FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update codes" ON public.access_codes FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete codes" ON public.access_codes FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Tighten contest_settings: only admins
DROP POLICY "Only authenticated users can update settings" ON public.contest_settings;
CREATE POLICY "Admins can update settings" ON public.contest_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
