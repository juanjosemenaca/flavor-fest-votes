-- Align contest categories to the current AITORTILLA setup.
-- This migration is non-destructive: it updates known defaults and inserts missing categories.

-- 1) Rename/update known original categories to new names/order/description.
UPDATE public.categories
SET
  name = 'mejor pintxos',
  description = 'El pintxo más sabroso del concurso',
  display_order = 1
WHERE name IN ('Mejor Sabor', 'mejor pintxos');

UPDATE public.categories
SET
  name = 'más original',
  description = 'El pintxo más creativo e innovador',
  display_order = 2
WHERE name IN ('Más Original', 'más original');

UPDATE public.categories
SET
  name = 'mejor presentación',
  description = 'El pintxo con la presentación más atractiva',
  display_order = 3
WHERE name IN ('Mejor Presentación', 'mejor presentación');

-- 2) Insert missing categories requested for the contest.
INSERT INTO public.categories (name, description, display_order)
SELECT 'pintxo ilusión', 'El pintxo que más sorprende o emociona', 4
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categories
  WHERE name = 'pintxo ilusión'
);

INSERT INTO public.categories (name, description, display_order)
SELECT 'pintxo basura', 'El pintxo más desastre del concurso', 5
WHERE NOT EXISTS (
  SELECT 1
  FROM public.categories
  WHERE name = 'pintxo basura'
);
