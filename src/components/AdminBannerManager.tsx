import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { bannersQuery } from "@/components/BannerCarousel";
import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { randomFileName } from "@/lib/storage";

export function AdminBannerManager() {
  const queryClient = useQueryClient();
  const { data: banners = [] } = useQuery(bannersQuery);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  const refresh = () => queryClient.invalidateQueries({ queryKey: bannersQuery.queryKey });

  async function addBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Pilih gambar banner terlebih dahulu.");
    if (file.size > 8 * 1024 * 1024) return toast.error("Ukuran gambar maksimal 8 MB.");
    setBusy(true);
    const path = `banners/${randomFileName(file.name)}`;
    const up = await supabase.storage.from("school-images").upload(path, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      return toast.error("Gagal mengunggah gambar.");
    }
    const { error } = await supabase.from("banners").insert({
      title: title.trim() || null,
      subtitle: subtitle.trim() || null,
      image_url: path,
      sort_order: banners.length,
    });
    setBusy(false);
    if (error) return toast.error("Gagal menyimpan banner.");
    toast.success("Banner ditambahkan.");
    setTitle("");
    setSubtitle("");
    setFile(null);
    setInputKey((k) => k + 1);
    refresh();
  }

  async function removeBanner(id: string, path: string) {
    if (!confirm("Hapus banner ini?")) return;
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) return toast.error("Gagal menghapus banner.");
    await supabase.storage.from("school-images").remove([path]);
    toast.success("Banner dihapus.");
    refresh();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
      <h2 className="flex items-center gap-2 text-display text-xl uppercase text-primary">
        <ImagePlus className="size-5" /> Banner Berganti
      </h2>
      <p className="text-sm font-semibold text-muted-foreground">
        Banner tampil di halaman utama dan semua dashboard, berganti otomatis setiap 5 detik. Tambah atau hapus sebanyak apa pun.
      </p>

      <form onSubmit={addBanner} className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="banner-title">Judul (opsional)</Label>
          <Input id="banner-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="PENGUMUMAN SEKOLAH" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="banner-sub">Keterangan (opsional)</Label>
          <Input id="banner-sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Ujian akhir semester dimulai..." />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="banner-file">Gambar banner</Label>
          <Input key={inputKey} id="banner-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>
        <Button type="submit" disabled={busy} className="sm:col-span-2">
          {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />} Unggah Banner
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-xl border border-border bg-background p-2">
            <StoredImage bucket="school-images" value={b.image_url} alt={b.title ?? "Banner"} className="h-16 w-28 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">{b.title || "Tanpa judul"}</p>
              <p className="truncate text-xs text-muted-foreground">{b.subtitle}</p>
            </div>
            <Button size="icon" variant="destructive" onClick={() => removeBanner(b.id, b.image_url)} aria-label="Hapus banner">
              <Trash2 />
            </Button>
          </div>
        ))}
        {banners.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada banner.</p> : null}
      </div>
    </section>
  );
}
