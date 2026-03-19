-- Add is_hidden to event_photos (admin can hide from landing)
ALTER TABLE public.event_photos ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

-- Admin policies for event_photos
CREATE POLICY "Admins can update event photos" ON public.event_photos
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete event photos" ON public.event_photos
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Admin can delete from storage
CREATE POLICY "Admins can delete event photos storage" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'event-photos' AND public.is_admin(auth.uid()));
