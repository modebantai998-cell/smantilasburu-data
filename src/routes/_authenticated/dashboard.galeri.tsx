import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGallery } from "@/hooks/useGallery";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { randomFileName } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/dashboard/galeri")({
  component: KelolaGaleri,
});

function KelolaGaleri() {
  const { isAdmin, userId } = useMe();
  const queryClient = useQueryClient();
  const gallery = useGallery();

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Pilih gambar terlebih dahulu.");
      if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 5 MB.");
      const path = `${userId}/${randomFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("school-images")
        .upload(path, file);
      if (uploadError) throw new Error("Gambar gagal diunggah.");

      const { error } = await supabase.from("gallery").insert({
        title: title.trim(),
        caption: caption.trim() || null,
        image_url: path,
      });
      if (error) throw new Error("Data galeri gagal disimpan.");
    },
    onSuccess: () => {
      toast.success("Foto ditambahkan ke galeri.");
      setTitle("");
      setCaption("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw new Error("Foto gagal dihapus.");
    },
    onSuccess: () => {
      toast.success("Foto dihapus.");
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
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

  return (
    <div className="space-y-6">
      <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">Kelola Galeri</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          upload.mutate();
        }}
        className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="galeri-judul" className="uppercase">
              Judul Foto
            </Label>
            <Input
              id="galeri-judul"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="galeri-caption" className="uppercase">
              Keterangan (opsional)
            </Label>
            <Input
              id="galeri-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={160}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="galeri-file" className="uppercase">
            Berkas Gambar
          </Label>
          <Input
            id="galeri-file"
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
          />
        </div>

        <Button type="submit" variant="gold" disabled={upload.isPending}>
          <Upload />
          {upload.isPending ? "Mengunggah..." : "Tambah ke Galeri"}
        </Button>
      </form>

      {gallery.data && gallery.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.data.map((item) => (
            <figure
              key={item.id}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <StoredImage
                bucket="school-images"
                value={item.image_url}
                alt={item.title}
                className="h-44 w-full object-cover"
              />
              <figcaption className="space-y-2 p-4">
                <h2 className="text-base uppercase">{item.title}</h2>
                {item.caption ? (
                  <p className="text-sm font-semibold text-muted-foreground">{item.caption}</p>
                ) : null}
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(item.id)}
                >
                  <Trash2 />
                  Hapus
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Belum ada foto pada galeri.
        </p>
      )}
    </div>
  );
}
