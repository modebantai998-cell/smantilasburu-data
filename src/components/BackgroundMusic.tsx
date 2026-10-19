import { Music, Music2, Power } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useMe } from "@/hooks/useMe";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { resolveImageSrc } from "@/lib/storage";

/**
 * Musik latar halaman utama.
 * - Diputar otomatis saat halaman dibuka (browser memblokir autoplay bersuara,
 *   jadi dimulai dalam keadaan senyap lalu dibunyikan pada sentuhan pertama).
 * - Papan musik tampil di pojok kanan atas, di bawah teks berjalan.
 * - Pengunjung tidak bisa mematikan musik; hanya admin yang punya tombolnya.
 */
export function BackgroundMusic() {
  const { data: settings } = useSiteSettings();
  const { isAdmin } = useMe();
  const cfg = settings?.music;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [src, setSrc] = useState("");
  const [adminMuted, setAdminMuted] = useState(false);

  useEffect(() => {
    let active = true;
    if (cfg?.audio) {
      resolveImageSrc("site-audio", cfg.audio).then((resolved) => {
        if (active) setSrc(resolved);
      });
    } else {
      setSrc("");
    }
    return () => {
      active = false;
    };
  }, [cfg?.audio]);

  // Autoplay: coba langsung bersuara, jika diblokir mulai senyap lalu
  // bunyikan saat interaksi pertama pengguna.
  useEffect(() => {
    if (!src || !cfg?.enabled || adminMuted) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = false;
    const attempt = audio.play();
    if (attempt) {
      attempt.catch(() => {
        audio.muted = true;
        audio.play().catch(() => {});
        const unmute = () => {
          audio.muted = false;
          audio.play().catch(() => {});
          window.removeEventListener("pointerdown", unmute);
          window.removeEventListener("keydown", unmute);
          window.removeEventListener("touchstart", unmute);
        };
        window.addEventListener("pointerdown", unmute, { once: true });
        window.addEventListener("keydown", unmute, { once: true });
        window.addEventListener("touchstart", unmute, { once: true });
      });
    }
  }, [src, cfg?.enabled, adminMuted]);

  if (!cfg?.audio || !cfg?.enabled) return null;

  return (
    <>
      <audio ref={audioRef} src={src || undefined} loop preload="auto" />
      <div className="fixed right-3 top-[104px] z-40 flex items-center gap-2 rounded-xl border border-accent/40 bg-primary-deep/95 px-3 py-2 text-primary-foreground shadow-strong backdrop-blur">
        <span className="grid size-7 place-items-center rounded-lg bg-gold-gradient text-accent-foreground">
          <Music className="size-4" strokeWidth={2.6} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-accent">
            Musik Sekolah
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-primary-foreground/80">
            <Music2 className="size-3" strokeWidth={2.6} />
            {adminMuted ? "Dimatikan admin" : "Sedang diputar"}
          </span>
        </span>
        {isAdmin ? (
          <button
            type="button"
            onClick={() => setAdminMuted((value) => !value)}
            aria-label={adminMuted ? "Putar musik" : "Matikan musik"}
            className="ml-1 grid size-7 place-items-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
          >
            <Power
              className={adminMuted ? "size-4 text-destructive" : "size-4 text-accent"}
              strokeWidth={2.6}
            />
          </button>
        ) : null}
      </div>
    </>
  );
}
