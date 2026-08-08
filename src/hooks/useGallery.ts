import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type GalleryItem = {
  id: string;
  title: string;
  caption: string | null;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export function useGallery(limit?: number) {
  return useQuery({
    queryKey: ["gallery", limit ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("gallery")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as GalleryItem[];
    },
  });
}
