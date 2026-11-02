import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, ImagePlus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { StoredImage } from "@/components/StoredImage";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL } from "@/lib/school";
import { randomFileName } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/dashboard/story")({
  component: StoryPage,
});

type StoryProfile = {
  full_name: string;
  role: string;
  class_name: string | null;
  avatar_url: string | null;
};

type Story = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  profile: StoryProfile | null;
};

function remainingLabel(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Kedaluwarsa";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `Hilang dalam ${hours} jam ${minutes} menit`;
}

function StoryPage() {
  const { profile, userId, isAdmin, isApproved } = useMe();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [viewing, setViewing] = useState<{ userId: string; index: number } | null>(null);

  const stories = useQuery({
    queryKey: ["stories"],
    enabled: isApproved,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select(
          "*, profile:profiles!stories_user_id_fkey(id, full_name, role, class_name, avatar_url)",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Story[];
    },
  });

  useEffect(() => {
    if (!isApproved) return;
    const channel = supabase
      .channel("stories-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => {
        queryClient.invalidateQueries({ queryKey: ["stories"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isApproved, queryClient]);

  const grouped = useMemo(() => {
    const map = new Map<string, Story[]>();
    for (const story of stories.data ?? []) {
      const list = map.get(story.user_id) ?? [];
      list.push(story);
      map.set(story.user_id, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return [...map.entries()];
  }, [stories.data]);

  const upload = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sesi tidak ditemukan.");
      if (!file) throw new Error("Pilih gambar untuk story.");
      if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 5 MB.");

      const path = `${userId}/${randomFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(path, file);
      if (uploadError) throw new Error("Gambar gagal diunggah.");

      const { error } = await supabase.from("stories").insert({
        user_id: userId,
        image_url: path,
        caption: caption.trim() || null,
      });
      if (error) throw new Error("Story gagal dikirim.");
    },
    onSuccess: () => {
      setFile(null);
      setPreview(null);
      setCaption("");
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Story terkirim. Hilang otomatis setelah 24 jam.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function deleteStory(id: string) {
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) {
      toast.error("Story gagal dihapus.");
      return;
    }
    setViewing(null);
    queryClient.invalidateQueries({ queryKey: ["stories"] });
    toast.success("Story dihapus.");
  }

  if (!isApproved) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Story terbuka setelah akun Anda disetujui admin.
      </p>
    );
  }

  const viewingList = viewing ? (grouped.find(([id]) => id === viewing.userId)?.[1] ?? []) : [];
  const viewingStory = viewingList[viewing?.index ?? 0] ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">Story</h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Story hilang otomatis setelah 24 jam, seperti WhatsApp, Facebook, dan Instagram.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!file) {
            toast.error("Pilih gambar untuk story.");
            return;
          }
          upload.mutate();
        }}
        className="rounded-2xl border border-border bg-card p-5 shadow-card"
      >
        <h2 className="font-extrabold uppercase">Unggah Story Baru</h2>
        {preview ? (
          <div className="relative mt-3 w-40">
            <img
              src={preview}
              alt="Pratinjau story"
              className="aspect-[9/16] w-40 rounded-xl border border-border object-cover"
            />
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -right-2 -top-2 size-7"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
            >
              <X />
            </Button>
          </div>
        ) : (
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-xs font-extrabold uppercase tracking-wide hover:bg-secondary">
            <ImagePlus className="size-4" />
            Pilih Gambar Story
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0] ?? null;
                setFile(selected);
                setPreview(selected ? URL.createObjectURL(selected) : null);
              }}
            />
          </label>
        )}

        <Input
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Tulis keterangan (opsional)..."
          maxLength={200}
          className="mt-3 max-w-md font-semibold"
        />

        <Button type="submit" variant="gold" className="mt-3" disabled={upload.isPending}>
          {upload.isPending ? "Mengirim..." : "Kirim Story"}
        </Button>
      </form>

      <section>
        <h2 className="font-extrabold uppercase">Story Aktif</h2>
        {stories.isLoading ? (
          <p className="mt-3 text-sm font-bold uppercase text-muted-foreground">Memuat story...</p>
        ) : grouped.length === 0 ? (
          <p className="mt-3 text-sm font-bold uppercase text-muted-foreground">
            Belum ada story. Jadilah yang pertama mengunggah!
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-4">
            {grouped.map(([storyUserId, list]) => {
              const first = list[0];
              if (!first) return null;
              return (
                <button
                  key={storyUserId}
                  type="button"
                  onClick={() => setViewing({ userId: storyUserId, index: 0 })}
                  className="flex w-20 flex-col items-center gap-2"
                >
                  <span className="grid size-20 place-items-center rounded-full bg-hero-gradient p-[3px]">
                    <UserAvatar
                      avatarUrl={first.profile?.avatar_url ?? null}
                      fullName={first.profile?.full_name ?? "Pengguna"}
                      className="size-full border-0"
                    />
                  </span>
                  <span className="w-full truncate text-center text-[11px] font-extrabold uppercase tracking-wide">
                    {first.profile?.full_name ?? "Pengguna"}
                    <span className="block text-[10px] font-bold text-muted-foreground">
                      {list.length} story
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(viewingStory)}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        {viewingStory ? (
          <DialogContent className="max-w-sm p-0 sm:max-w-sm">
            <DialogTitle className="sr-only">
              Story {viewingStory.profile?.full_name ?? "Pengguna"}
            </DialogTitle>
            <div className="relative">
              <StoredImage
                bucket="chat-images"
                value={viewingStory.image_url}
                alt="Story"
                className="max-h-[70vh] w-full rounded-2xl object-contain"
              />
              <div className="space-y-2 p-4">
                <p className="text-sm font-extrabold uppercase">
                  {viewingStory.profile?.full_name ?? "Pengguna"}
                  {viewingStory.profile ? ` · ${ROLE_LABEL[viewingStory.profile.role]}` : ""}
                  {viewingStory.profile?.class_name ? ` ${viewingStory.profile.class_name}` : ""}
                </p>
                {viewingStory.caption ? (
                  <p className="text-sm font-semibold leading-relaxed">{viewingStory.caption}</p>
                ) : null}
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground">
                  <Clock className="size-3.5" />
                  {remainingLabel(viewingStory.expires_at)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 border-t border-border p-3">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={viewing!.index === 0}
                  onClick={() => setViewing({ ...viewing!, index: viewing!.index - 1 })}
                >
                  <ChevronLeft />
                  Sebelumnya
                </Button>
                {(viewingStory.user_id === userId || isAdmin) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteStory(viewingStory.id)}
                  >
                    <Trash2 />
                    Hapus
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={viewing!.index >= viewingList.length - 1}
                  onClick={() => setViewing({ ...viewing!, index: viewing!.index + 1 })}
                >
                  Berikutnya
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>

      {profile ? null : null}
    </div>
  );
}
