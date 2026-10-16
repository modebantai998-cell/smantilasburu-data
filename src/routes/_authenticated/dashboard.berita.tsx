import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { randomFileName } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/dashboard/berita")({
  component: BeritaPage,
});

function BeritaPage() {
  const { userId, isApproved, isAdmin } = useMe();
  const queryClient = useQueryClient();
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const news = useQuery({
    queryKey: ["news"],
    enabled: isApproved,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const people = useQuery({
    queryKey: ["people-map"],
    enabled: isApproved,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, member_id");
      return data ?? [];
    },
  });
  const byId = Object.fromEntries((people.data ?? []).map((p) => [p.id, p]));
  const found = search.trim()
    ? (people.data ?? []).find((p) => p.member_id?.toUpperCase() === search.trim().toUpperCase())
    : undefined;

  async function post() {
    if (!caption.trim() || !userId) return toast.error("Tulis berita terlebih dahulu.");
    setBusy(true);
    try {
      let imagePath: string | null = null;
      if (file) {
        const path = `${userId}/${randomFileName(file.name)}`;
        const { error } = await supabase.storage.from("chat-images").upload(path, file);
        if (error) return toast.error("Gambar gagal diunggah.");
        imagePath = path;
      }
      const { error } = await supabase
        .from("news")
        .insert({ author_id: userId, caption: caption.trim(), image_url: imagePath });
      if (error) return toast.error("Berita gagal diposting.");
      setCaption("");
      setFile(null);
      toast.success("Berita diposting.");
      queryClient.invalidateQueries({ queryKey: ["news"] });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await supabase.from("news").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["news"] });
  }

  if (!isApproved) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">Berita Sekolah</h1>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Tulis berita terkini sekolah..."
            maxLength={2000}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              className="flex-1"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={post} disabled={busy}>
              {busy ? "Memposting..." : "Posting Berita"}
            </Button>
          </div>
        </div>

        {(news.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase text-muted-foreground">
            Belum ada berita.
          </p>
        ) : (
          news.data?.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border-l-4 border-primary bg-card p-4 shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-extrabold">
                    {byId[item.author_id]?.full_name ?? "Pengguna"}{" "}
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-xs">
                      {byId[item.author_id]?.member_id}
                    </span>
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {new Date(item.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
                {isAdmin || item.author_id === userId ? (
                  <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                    <Trash2 />
                  </Button>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-wrap font-semibold">{item.caption}</p>
              {item.image_url ? (
                <StoredImage
                  bucket="chat-images"
                  value={item.image_url}
                  alt="Foto berita"
                  className="mt-3 w-full rounded-lg"
                />
              ) : null}
            </article>
          ))
        )}
      </div>

      <aside className="h-fit rounded-2xl border-t-4 border-primary bg-card p-4 shadow-card">
        <h2 className="text-sm font-extrabold uppercase">Cari ID Anggota</h2>
        <Input
          className="mt-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="SM13-..."
        />
        {search.trim() ? (
          <p className="mt-3 rounded-lg bg-secondary p-3 text-sm font-bold">
            {found ? `${found.full_name} — ${found.member_id}` : "ID tidak ditemukan"}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
