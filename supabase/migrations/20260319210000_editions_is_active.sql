-- Marcar qué edición se muestra en la landing pública
ALTER TABLE public.editions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Activar la más reciente si ninguna está activa
UPDATE public.editions e
SET is_active = true
WHERE e.year = (SELECT MAX(year) FROM public.editions)
  AND NOT EXISTS (SELECT 1 FROM public.editions WHERE is_active = true);
