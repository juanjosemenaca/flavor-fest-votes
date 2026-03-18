
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Contest settings table
CREATE TABLE public.contest_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_name TEXT NOT NULL DEFAULT 'AITORTILLA',
  results_published BOOLEAN NOT NULL DEFAULT false,
  voting_open BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contest_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read contest settings" ON public.contest_settings FOR SELECT USING (true);
CREATE POLICY "Only authenticated users can update settings" ON public.contest_settings FOR UPDATE TO authenticated USING (true);

INSERT INTO public.contest_settings (contest_name) VALUES ('AITORTILLA');

-- Vote categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Auth users can manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Dishes table
CREATE TABLE public.dishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read dishes" ON public.dishes FOR SELECT USING (true);
CREATE POLICY "Auth users can manage dishes" ON public.dishes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Access codes for voters
CREATE TABLE public.access_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can manage codes" ON public.access_codes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can read codes for validation" ON public.access_codes FOR SELECT USING (true);

-- Votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code_id UUID NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES public.dishes(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  liked BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(access_code_id, dish_id, category_id)
);

ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert votes" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read votes" ON public.votes FOR SELECT USING (true);

-- Triggers
CREATE TRIGGER update_contest_settings_updated_at BEFORE UPDATE ON public.contest_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON public.dishes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for dish photos
INSERT INTO storage.buckets (id, name, public) VALUES ('dish-photos', 'dish-photos', true);
CREATE POLICY "Anyone can view dish photos" ON storage.objects FOR SELECT USING (bucket_id = 'dish-photos');
CREATE POLICY "Auth users can upload dish photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dish-photos');
CREATE POLICY "Auth users can update dish photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'dish-photos');
CREATE POLICY "Auth users can delete dish photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'dish-photos');

-- Insert some default categories
INSERT INTO public.categories (name, description, display_order) VALUES
  ('mejor pintxos', 'El pintxo más sabroso del concurso', 1),
  ('más original', 'El pintxo más creativo e innovador', 2),
  ('mejor presentación', 'El pintxo con la presentación más atractiva', 3),
  ('pintxo ilusión', 'El pintxo que más sorprende o emociona', 4),
  ('pintxo basura', 'El pintxo más desastre del concurso', 5);
