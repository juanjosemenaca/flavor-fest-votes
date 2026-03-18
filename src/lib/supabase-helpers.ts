import { supabase } from "@/integrations/supabase/client";

export async function validateAccessCode(code: string) {
  const { data, error } = await supabase
    .from("access_codes")
    .select("*")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchDishes() {
  const { data, error } = await supabase
    .from("dishes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchContestSettings() {
  const { data, error } = await supabase
    .from("contest_settings")
    .select("*")
    .limit(1)
    .single();
  if (error) throw error;
  return data;
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
  liked: boolean
) {
  const { error } = await supabase.from("votes").upsert(
    {
      access_code_id: accessCodeId,
      dish_id: dishId,
      category_id: categoryId,
      liked,
    },
    { onConflict: "access_code_id,dish_id,category_id" }
  );
  if (error) throw error;
}

export async function fetchAllVotes() {
  const { data, error } = await supabase
    .from("votes")
    .select("*, dishes(name, author), categories(name)");
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

export function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
