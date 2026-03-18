-- Enforce one selected dish per category for each access code.
-- Keep only the latest vote per (access_code_id, category_id) before adding the constraint.

WITH ranked_votes AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY access_code_id, category_id
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.votes
)
DELETE FROM public.votes v
USING ranked_votes r
WHERE v.id = r.id
  AND r.rn > 1;

ALTER TABLE public.votes
DROP CONSTRAINT IF EXISTS votes_access_code_id_dish_id_category_id_key;

ALTER TABLE public.votes
ADD CONSTRAINT votes_access_code_id_category_id_key
UNIQUE (access_code_id, category_id);
