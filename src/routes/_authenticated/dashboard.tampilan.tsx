import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImageUp, Music, Save, Trash2, Type } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_SETTINGS,
  SETTINGS_QUERY_KEY,
  useSiteSettings,
} from "@/hooks/useSiteSettings";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { randomFileName } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/dashboard/tampilan")({
  component: KelolaTampilan,
});

const COLOR_OPTIONS = [
  { value: "rainbow", label: "🌈 Pelangi Warna Warni" },
  { value: "red", label: "Merah" },
  { value: "#00FF00", label: "Hijau Neon" },
  { value: "cyan", label: "Biru Neon" },
  { value: "yellow", label: "Kuning" },
  { value: "white", label: "Putih" },
] as const;

function KelolaTampilan() {
  const { isAdmin, userId } = useMe();
  const queryClient = useQueryClient();
  const settings = useSiteSettings();

  // Teks berjalan
  const [marqueeText, setMarqueeText] = useState("");
  const [marqueeColor, setMarqueeColor] = useState("rainbow");
  const [marqueeSpeed, setMarqueeSpeed] = useState(20);

  // Halaman utama (hero)
  const [heroTitle, setHeroTitle] = useState("");
  const [heroTagline, setHeroTagline] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroImage, setHeroImage] = useState("");

  // Musik latar
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [musicAudio, setMusicAudio] = useState("");
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    if (!settings.data) return;
    setMarqueeText(settings.data.marquee.text);
    setMarqueeColor(settings.data.marquee.color);
    setMarqueeSpeed(settings.data.marquee.speed);
    setHeroTitle(settings.data.hero.title);
    setHeroTagline(settings.data.hero.tagline);
    setHeroDescription(settings.data.hero.description);
    setHeroImage(settings.data.hero.image);
    setMusicAudio(settings.data.music.audio);
    setMusicEnabled(settings.data.music.enabled);
  }, [settings.data]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });

  const saveMarquee = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert({
        key: "marquee",
        value: {
          text: marqueeText.trim(),
          color: marqueeColor,
          speed: Number(marqueeSpeed),
        },
      });
      if (error) throw new Error("Pengaturan teks berjalan gagal disimpan.");
    },
    onSuccess: () => {
      toast.success("Teks berjalan disimpan.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveHero = useMutation({
    mutationFn: async () => {
      let imagePath = heroImage;

      if (heroFile) {
        if (heroFile.size > 5 * 1024 * 1024) {
          throw new Error("Ukuran gambar maksimal 5 MB.");
        }
        const path = `hero/${randomFileName(heroFile.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("school-images")
          .upload(path, heroFile);
        if (uploadError) throw new Error("Foto gagal diunggah.");
        imagePath = path;
      }

      const { error } = await supabase.from("site_settings").upsert({
        key: "hero",
        value: {
          image: imagePath,
          title: heroTitle.trim(),
          tagline: heroTagline.trim(),
          description: heroDescription.trim(),
        },
      });
      if (error) throw new Error("Pengaturan halaman utama gagal disimpan.");
    },
    onSuccess: () => {
      toast.success("Tampilan halaman utama disimpan.");
      setHeroFile(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetHero = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert({
        key: "hero",
        value: DEFAULT_SETTINGS.hero,
      });
      if (error) throw new Error("Gagal mengembalikan tampilan awal.");
    },
    onSuccess: () => {
      toast.success("Tampilan halaman utama dikembalikan ke pengaturan awal.");
      setHeroFile(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveMusic = useMutation({
    mutationFn: async () => {
      let audioPath = musicAudio;

      if (musicFile) {
        if (musicFile.size > 20 * 1024 * 1024) {
          throw new Error("Ukuran berkas musik maksimal 20 MB.");
        }
        const path = `music/${randomFileName(musicFile.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("site-audio")
          .upload(path, musicFile);
        if (uploadError) throw new Error("Berkas musik gagal diunggah.");
        audioPath = path;
      }

      const { error } = await supabase.from("site_settings").upsert({
        key: "music",
        value: {
          audio: audioPath,
          enabled: musicEnabled,
        },
      });
      if (error) throw new Error("Pengaturan musik gagal disimpan.");
    },
    onSuccess: () => {
      toast.success("Pengaturan musik disimpan.");
      setMusicFile(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMusic = useMutation({
    mutationFn: async () => {
      if (musicAudio) {
        await supabase.storage.from("site-audio").remove([musicAudio]);
      }
      const { error } = await supabase.from("site_settings").upsert({
        key: "music",
        value: { audio: "", enabled: true },
      });
      if (error) throw new Error("Gagal menghapus musik.");
    },
    onSuccess: () => {
      toast.success("Musik dihapus dari halaman utama.");
      setMusicFile(null);
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isAdmin) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Halaman ini hanya untuk admin sekolah.
      </p>
    );
  }

  const isRainbow = marqueeColor === "rainbow";

  return (
    <div className="space-y-6">
      <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">
        Kelola Tampilan
      </h1>

      {/* Teks berjalan */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-display text-xl uppercase text-primary">
          <Type className="size-5" strokeWidth={2.4} />
          Teks Berjalan
        </h2>

        <div className="space-y-1.5">
          <Label htmlFor="marquee-text" className="uppercase">
            Isi Teks
          </Label>
          <Input
            id="marquee-text"
            value={marqueeText}
            onChange={(event) => setMarqueeText(event.target.value)}
            placeholder="Tulis teks berjalan..."
            maxLength={200}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="marquee-color" className="uppercase">
              Warna
            </Label>
            <select
              id="marquee-color"
              value={marqueeColor}
              onChange={(event) => setMarqueeColor(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold"
            >
              {COLOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="marquee-speed" className="uppercase">
              Kecepatan (5 cepat — 50 lambat)
            </Label>
            <input
              id="marquee-speed"
              type="range"
              min={5}
              max={50}
              value={marqueeSpeed}
              onChange={(event) => setMarqueeSpeed(Number(event.target.value))}
              className="w-full accent-primary"
            />
            <p className="text-xs font-bold text-muted-foreground">
              Nilai saat ini: {marqueeSpeed}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-primary-deep py-2">
          <p
            className={
              isRainbow
                ? "marquee-rainbow-text text-sm font-extrabold uppercase tracking-[0.25em]"
                : "marquee-run text-sm font-extrabold uppercase tracking-[0.25em]"
            }
            style={{
              ["--marquee-speed" as never]: `${marqueeSpeed}s`,
              ...(isRainbow ? {} : { color: marqueeColor }),
            }}
          >
            {marqueeText || "Contoh teks berjalan..."}
          </p>
        </div>

        <Button
          variant="gold"
          disabled={saveMarquee.isPending}
          onClick={() => saveMarquee.mutate()}
        >
          <Save />
          {saveMarquee.isPending ? "Menyimpan..." : "Simpan Teks Berjalan"}
        </Button>
      </section>

      {/* Halaman utama */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-display text-xl uppercase text-primary">
          <ImageUp className="size-5" strokeWidth={2.4} />
          Foto &amp; Teks Halaman Utama
        </h2>
        <p className="text-sm font-semibold text-muted-foreground">
          Kosongkan kolom teks untuk memakai tulisan bawaan. Foto hero diganti dengan mengunggah
          berkas baru.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="hero-file" className="uppercase">
            Ganti Foto Hero (Upload)
          </Label>
          <Input
            id="hero-file"
            type="file"
            accept="image/*"
            onChange={(event) => setHeroFile(event.target.files?.[0] ?? null)}
          />
          {heroFile ? (
            <p className="text-xs font-bold text-muted-foreground">
              Berkas dipilih: {heroFile.name}
            </p>
          ) : heroImage ? (
            <p className="text-xs font-bold text-muted-foreground">
              Foto kustom sudah terpasang di halaman utama.
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hero-title" className="uppercase">
              Judul Utama
            </Label>
            <Input
              id="hero-title"
              value={heroTitle}
              onChange={(event) => setHeroTitle(event.target.value)}
              placeholder="SMA NEGERI 13 BURU"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-tagline" className="uppercase">
              Slogan
            </Label>
            <Input
              id="hero-tagline"
              value={heroTagline}
              onChange={(event) => setHeroTagline(event.target.value)}
              placeholder="Berprestasi, Berkarakter, Berbudaya"
              maxLength={120}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hero-description" className="uppercase">
            Kalimat Pengantar
          </Label>
          <textarea
            id="hero-description"
            value={heroDescription}
            onChange={(event) => setHeroDescription(event.target.value)}
            placeholder="Deskripsi singkat sekolah pada halaman utama..."
            maxLength={400}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="gold"
            disabled={saveHero.isPending}
            onClick={() => saveHero.mutate()}
          >
            <Save />
            {saveHero.isPending ? "Menyimpan..." : "Simpan Halaman Utama"}
          </Button>
          <Button
            variant="outline"
            disabled={resetHero.isPending}
            onClick={() => resetHero.mutate()}
          >
            Kembalikan Tampilan Awal
          </Button>
        </div>
      </section>

      {/* Musik latar */}
      <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="flex items-center gap-2 text-display text-xl uppercase text-primary">
          <Music className="size-5" strokeWidth={2.4} />
          Musik Latar
        </h2>
        <p className="text-sm font-semibold text-muted-foreground">
          Unggah berkas musik (tanpa link) untuk diputar otomatis saat pengunjung membuka halaman
          utama. Papan musik tampil di pojok kanan atas, di bawah teks berjalan. Hanya admin yang
          bisa mematikan musik.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="music-file" className="uppercase">
            Unggah Berkas Musik (MP3 / WAV / OGG, maks 20 MB)
          </Label>
          <Input
            id="music-file"
            type="file"
            accept="audio/*"
            onChange={(event) => setMusicFile(event.target.files?.[0] ?? null)}
          />
          {musicFile ? (
            <p className="text-xs font-bold text-muted-foreground">
              Berkas dipilih: {musicFile.name}
            </p>
          ) : musicAudio ? (
            <p className="text-xs font-bold text-muted-foreground">
              Musik kustom sudah terpasang di halaman utama.
            </p>
          ) : (
            <p className="text-xs font-bold text-muted-foreground">
              Belum ada musik terpasang.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm font-bold uppercase text-muted-foreground">
          <input
            type="checkbox"
            checked={musicEnabled}
            onChange={(event) => setMusicEnabled(event.target.checked)}
            className="size-4 accent-primary"
          />
          Putar otomatis di halaman utama
        </label>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="gold"
            disabled={saveMusic.isPending}
            onClick={() => saveMusic.mutate()}
          >
            <Save />
            {saveMusic.isPending ? "Menyimpan..." : "Simpan Musik"}
          </Button>
          {musicAudio ? (
            <Button
              variant="outline"
              disabled={removeMusic.isPending}
              onClick={() => removeMusic.mutate()}
            >
              <Trash2 />
              {removeMusic.isPending ? "Menghapus..." : "Hapus Musik"}
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
