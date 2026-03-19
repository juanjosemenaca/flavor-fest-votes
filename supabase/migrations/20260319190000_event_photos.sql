-- Event photos: anyone can upload, shown in carousel on landing
CREATE TABLE public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edition_id UUID REFERENCES public.editions(id) ON DELETE CASCADE
);

CREATE INDEX event_photos_edition_idx ON public.event_photos(edition_id);
CREATE INDEX event_photos_created_idx ON public.event_photos(created_at DESC);

ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read event photos" ON public.event_photos FOR SELECT USING (true);
CREATE POLICY "Anyone can insert event photos" ON public.event_photos FOR INSERT WITH CHECK (true);

-- Storage bucket for event photos (public upload + read)
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view event photos" ON storage.objects FOR SELECT USING (bucket_id = 'event-photos');
CREATE POLICY "Anyone can upload event photos" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'event-photos');
CREATE POLICY "Anyone can upload event photos auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-photos');
