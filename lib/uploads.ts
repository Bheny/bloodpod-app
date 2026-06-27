import { createClient } from "@/lib/supabase/client";

export const UPLOADS_BUCKET = "uploads";
export const AVATARS_BUCKET = "avatars";
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_UPLOAD_TYPES = "image/*,application/pdf";

export function cardImagePath(supabaseId: string, cardId: string, side: "front" | "back", ext: string) {
  return `${supabaseId}/cards/${cardId}/${side}.${ext}`;
}

export function documentFilePath(supabaseId: string, documentId: string, ext: string) {
  return `${supabaseId}/documents/${documentId}/file.${ext}`;
}

export function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type === "application/pdf" ? "pdf" : "jpg";
}

export function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith(".pdf");
}

export async function uploadToStorage(path: string, file: File): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(UPLOADS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;
}

export async function getSignedUrl(path: string, expiresInSeconds = 300): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(UPLOADS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function deleteFromStorage(paths: string[]): Promise<void> {
  const valid = paths.filter(Boolean);
  if (valid.length === 0) return;
  const supabase = createClient();
  await supabase.storage.from(UPLOADS_BUCKET).remove(valid);
}

export async function uploadAvatar(file: File): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not signed in");

  const path = `${userData.user.id}/avatar.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) throw error;

  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  // the path is stable across re-uploads (upsert), so cache-bust with a version param
  return `${data.publicUrl}?v=${Date.now()}`;
}
