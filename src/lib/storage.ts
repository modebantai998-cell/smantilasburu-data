import { supabase } from "@/integrations/supabase/client";

/**
 * Gallery/chat images are stored either as a direct URL (seeded CDN assets)
 * or as an object path inside a private bucket. Resolve both to a usable src.
 */
export async function resolveImageSrc(bucket: string, value: string): Promise<string> {
  if (!value) return "";
  if (value.startsWith("http") || value.startsWith("/")) return value;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(value, 60 * 60);
  return data?.signedUrl ?? "";
}

export function randomFileName(originalName: string): string {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "jpg";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}
