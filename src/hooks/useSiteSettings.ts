import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type MarqueeSettings = {
  text: string;
  color: string;
  speed: number;
};

export type HeroSettings = {
  image: string;
  title: string;
  tagline: string;
  description: string;
};

export type SiteSettings = {
  marquee: MarqueeSettings;
  hero: HeroSettings;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  marquee: {
    text: "Selamat datang di SMA Negeri 13 Buru — Berprestasi, Berkarakter, Berbudaya",
    color: "rainbow",
    speed: 20,
  },
  hero: {
    image: "",
    title: "",
    tagline: "",
    description: "",
  },
};

export const SETTINGS_QUERY_KEY = ["site-settings"] as const;

export function useSiteSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    staleTime: 60_000,
    queryFn: async (): Promise<SiteSettings> => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;

      const map = new Map<string, unknown>(
        (data ?? []).map((row) => [row.key as string, row.value]),
      );

      return {
        marquee: {
          ...DEFAULT_SETTINGS.marquee,
          ...(map.get("marquee") as Partial<MarqueeSettings> | undefined),
        },
        hero: {
          ...DEFAULT_SETTINGS.hero,
          ...(map.get("hero") as Partial<HeroSettings> | undefined),
        },
      };
    },
  });
}
