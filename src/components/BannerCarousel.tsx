import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { useEffect, useState } from "react";

import { StoredImage } from "@/components/StoredImage";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type Banner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  sort_order: number;
  created_at: string;
};

export const BANNER_INTERVAL_MS = 5000;

export const bannersQuery = {
  queryKey: ["site-banners"],
  queryFn: async (): Promise<Banner[]> => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("sort_order")
      .order("created_at");
    return (data ?? []) as Banner[];
  },
};

/** Banner pengumuman: gambar unggahan admin, berganti otomatis tiap 5 detik. */
export function BannerCarousel({ className }: { className?: string }) {
  const { data: banners = [] } = useQuery(bannersQuery);
  const [index, setIndex] = useState(0);
  const total = banners.length;

  useEffect(() => {
    if (total <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % total), BANNER_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [total]);

  useEffect(() => {
    if (index >= total) setIndex(0);
  }, [index, total]);

  if (total === 0) {
    return (
      <div className={cn("relative overflow-hidden rounded-3xl bg-banner-gradient p-5 shadow-glow sm:p-6", className)}>
        <div className="flex items-center gap-4 text-primary-foreground">
          <Megaphone className="size-12 shrink-0 drop-shadow" strokeWidth={2.2} />
          <div>
            <p className="text-display text-xl uppercase sm:text-2xl">Pengumuman Sekolah</p>
            <p className="mt-1 text-sm font-bold">Selamat datang di SMA Negeri 13 Buru.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-[21/9] w-full overflow-hidden rounded-3xl border border-primary/40 bg-card shadow-glow sm:aspect-[3/1]", className)}>
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            i === index ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          aria-hidden={i !== index}
        >
          <StoredImage bucket="school-images" value={banner.image_url} alt={banner.title ?? "Banner sekolah"} className="h-full w-full object-cover" />
          {banner.title || banner.subtitle ? (
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/90 via-background/30 to-transparent p-4 sm:p-6">
              <div>
                {banner.title ? (
                  <p className="text-display text-lg uppercase text-foreground sm:text-2xl">{banner.title}</p>
                ) : null}
                {banner.subtitle ? (
                  <p className="mt-1 text-xs font-bold text-foreground/90 sm:text-sm">{banner.subtitle}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      ))}

      <span className="absolute right-3 top-3 rounded-full bg-background/70 px-3 py-1 font-mono text-xs font-black text-foreground">
        {index + 1}/{total}
      </span>
      {total > 1 ? (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Banner ${i + 1}`}
              className={cn("h-2 rounded-full transition-all", i === index ? "w-6 bg-primary" : "w-2 bg-foreground/50")}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
