import { supabase } from "@/integrations/supabase/client";

export type Edition = {
  id: string;
  year: number;
  contest_name: string;
  voting_open: boolean;
  results_published: boolean;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
};

type AccessCodeValidationResult =
  | { ok: true; data: { id: string; code: string; used: boolean; edition_id: string } }
  | { ok: false; reason: "invalid" | "used" };

/** Fetch all editions (years). Returns [] if table does not exist (migrations not applied). */
export async function fetchEditions(): Promise<Edition[]> {
  const { data, error } = await supabase
    .from("editions")
    .select("*")
    .order("year", { ascending: false });
  if (error) {
    const msg = (error as { message?: string }).message ?? "";
    if (msg.includes("does not exist") || (error as { code?: string }).code === "42P01") return [];
    throw error;
  }
  return data ?? [];
}

/** Fetch edition by year (2026, 2027, ...). Returns null if table does not exist. */
export async function fetchEditionByYear(year: number): Promise<Edition | null> {
  const { data, error } = await supabase
    .from("editions")
    .select("*")
    .eq("year", year)
    .maybeSingle();
  if (error) {
    const msg = (error as { message?: string }).message ?? "";
    if (msg.includes("does not exist") || (error as { code?: string }).code === "42P01") return null;
    throw error;
  }
  return data;
}

/** Fetch current edition (active one, or most recent). Falls back to contest_settings if editions not yet migrated. */
export async function fetchCurrentEdition(): Promise<Edition | null> {
  const editions = await fetchEditions();
  if (editions.length > 0) {
    const active = editions.find((e) => e.is_active);
    return active ?? editions[0];
  }
  // Fallback: contest_settings (pre-migration)
  const { data, error } = await supabase
    .from("contest_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    year: new Date().getFullYear(),
    contest_name: data.contest_name,
    voting_open: data.voting_open,
    results_published: data.results_published,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/** @deprecated Use fetchCurrentEdition or fetchEditionByYear. Kept for backward compat. */
export async function fetchContestSettings() {
  const edition = await fetchCurrentEdition();
  if (edition)
    return {
      contest_name: edition.contest_name,
      voting_open: edition.voting_open,
      results_published: edition.results_published,
    };
  const { data, error } = await supabase
    .from("contest_settings")
    .select("*")
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

/** Validate access code for the given edition. Uses current edition if editionId not provided. */
export async function validateAccessCode(
  code: string,
  editionId?: string
): Promise<AccessCodeValidationResult> {
  let q = supabase
    .from("access_codes")
    .select("id, code, used, edition_id")
    .eq("code", code.toUpperCase().trim());

  if (editionId) q = q.eq("edition_id", editionId);
  else {
    const edition = await fetchCurrentEdition();
    if (edition) q = q.eq("edition_id", edition.id);
  }

  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, reason: "invalid" } as AccessCodeValidationResult;
  if (data.used) return { ok: false, reason: "used" } as AccessCodeValidationResult;
  return { ok: true, data } as AccessCodeValidationResult;
}

/** Fetch dishes for an edition. Uses current edition if editionId not provided. Solo muestra pintxos de la edición seleccionada. */
export async function fetchDishes(editionId?: string) {
  let q = supabase.from("dishes").select("*").order("created_at", { ascending: true });
  if (editionId) {
    q = q.eq("edition_id", editionId);
  } else {
    const edition = await fetchCurrentEdition();
    if (edition) q = q.eq("edition_id", edition.id);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/** Fetch categories for an edition. Uses current edition if editionId not provided. */
export async function fetchCategories(editionId?: string) {
  let q = supabase.from("categories").select("*").order("display_order", { ascending: true });
  if (editionId) q = q.eq("edition_id", editionId);
  else {
    const edition = await fetchCurrentEdition();
    if (edition) q = q.eq("edition_id", edition.id);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchVotesForCode(accessCodeId: string) {
  const { data, error } = await supabase
    .from("votes")
    .select("*")
    .eq("access_code_id", accessCodeId);
  if (error) throw error;
  return data ?? [];
}

export async function submitVote(
  accessCodeId: string,
  dishId: string,
  categoryId: string,
  editionId: string
) {
  const { error } = await supabase.from("votes").upsert(
    {
      access_code_id: accessCodeId,
      dish_id: dishId,
      category_id: categoryId,
      edition_id: editionId,
      liked: true,
    },
    { onConflict: "access_code_id,category_id" }
  );
  if (error) throw error;
}

/** Fetch all votes for an edition. Uses current edition if editionId not provided. */
export async function fetchAllVotes(editionId?: string) {
  let q = supabase.from("votes").select("*, dishes(name, author), categories(name)");
  if (editionId) q = q.eq("edition_id", editionId);
  else {
    const edition = await fetchCurrentEdition();
    if (edition) q = q.eq("edition_id", edition.id);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export function getDishPhotoUrl(path: string) {
  const { data } = supabase.storage.from("dish-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadDishPhoto(file: File) {
  const ext = file.name.split(".").pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("dish-photos")
    .upload(fileName, file);
  if (error) throw error;
  return getDishPhotoUrl(fileName);
}

/** Get public URL for event photo */
export function getEventPhotoUrl(path: string) {
  const { data } = supabase.storage.from("event-photos").getPublicUrl(path);
  return data.publicUrl;
}

/** Upload event photo (public, no auth required). Returns URL. */
export async function uploadEventPhoto(file: File, editionId?: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  if (!["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    throw new Error("Formato no válido. Usa JPG, PNG, GIF o WebP.");
  }
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("event-photos").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const url = getEventPhotoUrl(fileName);
  const { error: insertError } = await supabase.from("event_photos").insert({
    storage_path: fileName,
    ...(editionId && { edition_id: editionId }),
  });
  if (insertError) throw insertError;
  return url;
}

/** Fetch random event photos for carousel. Excludes hidden. Muestra fotos de la edición activa + fotos sin edición. Fallback: si no hay con filtro, devuelve todas. */
export async function fetchRandomEventPhotos(count = 4, editionId?: string) {
  const edition = editionId ? null : await fetchCurrentEdition();
  const targetEditionId = editionId ?? edition?.id;

  let q = supabase.from("event_photos").select("storage_path").eq("is_hidden", false);
  if (targetEditionId) {
    q = q.or(`edition_id.eq.${targetEditionId},edition_id.is.null`);
  }
  const { data, error } = await q;
  if (error) throw error;
  let all = data ?? [];

  // Fallback: si no hay fotos con filtro de edición, intentar sin filtro (todas)
  if (all.length === 0 && targetEditionId) {
    const { data: fallback } = await supabase
      .from("event_photos")
      .select("storage_path")
      .eq("is_hidden", false);
    all = fallback ?? [];
  }

  const shuffled = [...all].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  return selected.map((p) => getEventPhotoUrl(p.storage_path));
}

export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
