import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Teks berjalan (marquee) di bawah header, teks/warna/kecepatannya
 * diatur admin dari dashboard (Kelola Tampilan).
 */
export function MarqueeBar() {
  const { data } = useSiteSettings();
  const cfg = data?.marquee;

  if (!cfg || !cfg.text.trim()) return null;

  const isRainbow = cfg.color === "rainbow";

  return (
    <div className="overflow-hidden border-b border-white/10 bg-primary-deep py-1.5">
      <p
        className={
          isRainbow
            ? "marquee-rainbow-text text-sm font-extrabold uppercase tracking-[0.25em]"
            : "marquee-run text-sm font-extrabold uppercase tracking-[0.25em]"
        }
        style={{
          ["--marquee-speed" as never]: `${cfg.speed}s`,
          ...(isRainbow ? {} : { color: cfg.color }),
        }}
      >
        {cfg.text}
      </p>
    </div>
  );
}
