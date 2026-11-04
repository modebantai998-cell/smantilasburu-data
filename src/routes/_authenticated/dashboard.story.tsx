import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, ImagePlus, Play, Trash2, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { openProfileViewer } from "@/components/ProfileViewer";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL } from "@/lib/school";
import { randomFileName, resolveImageSrc } from "@/lib/storage";

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
  media_type: string;
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

/** Media story: gambar atau video, mengambil tautan aman dari penyimpanan. */
function StoryMedia({ story }: { story: Story }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { data: src, isLoading } = useQuery({
    queryKey: ["story-media", story.id],
    queryFn: () => resolveImageSrc("chat-images", story.image_url),
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    video.play().catch(() => {
      // Browser menolak suara otomatis — ulangi dalam mode senyap.
      video.muted = true;
      video.play().catch(() => undefined);
    });
  }, [src, story.id]);

  if (isLoading || !src) {
    return <div className="size-full animate-pulse bg-neutral-900" />;
  }

  if (story.media_type === "video") {
    return (
      <video
        ref={videoRef}
        key={story.id}
        src={src}
        autoPlay
        loop
        playsInline
        className="max-h-full max-w-full object-contain"
      />
    );
  }

  return <img src={src} alt="Story" className="max-h-full max-w-full object-contain" />;
}

function StoryPage() {
  const { profile, userId, isAdmin, isApproved } = useMe();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [muted, setMuted] = useState(false);
  const touchStartX = useRef<number | null>(null);

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
      if (!file) throw new Error("Pilih gambar atau video untuk story.");
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) throw new Error("Berkas harus berupa gambar atau video.");
      if (isVideo && file.size > 30 * 1024 * 1024) throw new Error("Ukuran video maksimal 30 MB.");
      if (isImage && file.size > 5 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 5 MB.");

      const path = `${userId}/${randomFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage.from("chat-images").upload(path, file);
      if (uploadError) throw new Error("Story gagal diunggah.");

      const { error } = await supabase.from("stories").insert({
        user_id: userId,
        image_url: path,
        media_type: isVideo ? "video" : "image",
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
  const atFirst = (viewing?.index ?? 0) <= 0;
  const atLast = (viewing?.index ?? 0) >= viewingList.length - 1;

  const goPrev = () => {
    if (!viewing || atFirst) return;
    setViewing({ ...viewing, index: viewing.index - 1 });
  };
  const goNext = () => {
    if (!viewing || atLast) return;
    setViewing({ ...viewing, index: viewing.index + 1 });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">Story</h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Unggah gambar atau video. Story hilang otomatis setelah 24 jam, seperti WhatsApp, Facebook,
          dan Instagram.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!file) {
            toast.error("Pilih gambar atau video untuk story.");
            return;
          }
          upload.mutate();
        }}
        className="rounded-2xl border border-border bg-card p-5 shadow-card"
      >
        <h2 className="font-extrabold uppercase">Unggah Story Baru</h2>
        {preview ? (
          <div className="relative mt-3 w-40">
            {file?.type.startsWith("video/") ? (
              <video
                src={preview}
                muted
                controls
                className="aspect-[9/16] w-40 rounded-xl border border-border object-cover"
              />
            ) : (
              <img
                src={preview}
                alt="Pratinjau story"
                className="aspect-[9/16] w-40 rounded-xl border border-border object-cover"
              />
            )}
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
            Pilih Gambar / Video Story
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
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
                  className="relative flex w-20 flex-col items-center gap-2"
                >
                  <span className="grid size-20 place-items-center rounded-full bg-hero-gradient p-[3px]">
                    <UserAvatar
                      avatarUrl={first.profile?.avatar_url ?? null}
                      fullName={first.profile?.full_name ?? "Pengguna"}
                      className="size-full border-0"
                    />
                  </span>
                  {first.media_type === "video" ? (
                    <span className="absolute right-0 top-0 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-card">
                      <Play className="size-3 fill-current" />
                    </span>
                  ) : null}
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

      {viewingStory && viewing ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black"
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStartX.current;
            const end = event.changedTouches[0]?.clientX ?? null;
            touchStartX.current = null;
            if (start === null || end === null) return;
            const delta = end - start;
            if (delta > 60) goPrev();
            else if (delta < -60) goNext();
          }}
        >
          {/* Bilah kemajuan story */}
          <div className="flex gap-1 px-3 pt-3">
            {viewingList.map((item, index) => (
              <span
                key={item.id}
                className={`h-1 flex-1 rounded-full ${index <= viewing.index ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>

          {/* Baris atas: pemilik story + tombol */}
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <button
              type="button"
              onClick={() => openProfileViewer(viewingStory.user_id)}
              className="flex min-w-0 items-center gap-2 text-left"
            >
              <UserAvatar
                avatarUrl={viewingStory.profile?.avatar_url ?? null}
                fullName={viewingStory.profile?.full_name ?? "Pengguna"}
                className="size-9 border-white/40"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-extrabold uppercase text-white">
                  {viewingStory.profile?.full_name ?? "Pengguna"}
                </span>
                <span className="block text-[10px] font-bold uppercase tracking-wide text-white/70">
                  {viewingStory.profile ? ROLE_LABEL[viewingStory.profile.role] : ""}
                </span>
              </span>
            </button>
            <div className="flex items-center gap-2">
              {viewingStory.media_type === "video" ? (
                <button
                  type="button"
                  aria-label={muted ? "Bunyikan video" : "Senyapkan video"}
                  onClick={() => setMuted((value) => !value)}
                  className="grid size-9 place-items-center rounded-full border border-white/40 text-white"
                >
                  {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              ) : null}
              {(viewingStory.user_id === userId || isAdmin) ? (
                <button
                  type="button"
                  aria-label="Hapus story"
                  onClick={() => deleteStory(viewingStory.id)}
                  className="grid size-9 place-items-center rounded-full border border-white/40 text-white"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Tutup story"
                onClick={() => setViewing(null)}
                className="grid size-9 place-items-center rounded-full border border-white/40 text-white"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Media memenuhi layar */}
          <div className="relative min-h-0 flex-1">
            <div className="grid h-full place-items-center">
              <div className={muted ? "[&_video]:muted" : undefined} data-muted={muted}>
                <StoryMedia story={viewingStory} />
              </div>
            </div>

            {/* Zona geser kiri / kanan */}
            <button
              type="button"
              aria-label="Story sebelumnya"
              onClick={goPrev}
              disabled={atFirst}
              className="absolute bottom-0 left-0 top-0 w-1/4 disabled:cursor-default"
            />
            <button
              type="button"
              aria-label="Story berikutnya"
              onClick={goNext}
              disabled={atLast}
              className="absolute bottom-0 right-0 top-0 w-1/4 disabled:cursor-default"
            />

            <Button
              size="icon"
              variant="ghost"
              onClick={goPrev}
              disabled={atFirst}
              aria-label="Sebelumnya"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/40 text-white hover:bg-white/10 disabled:opacity-0"
            >
              <ChevronLeft />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={goNext}
              disabled={atLast}
              aria-label="Berikutnya"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/40 text-white hover:bg-white/10 disabled:opacity-0"
            >
              <ChevronRight />
            </Button>
          </div>

          {/* Keterangan di bawah */}
          <div className="space-y-1 px-4 py-4">
            {viewingStory.caption ? (
              <p className="text-sm font-semibold leading-relaxed text-white">{viewingStory.caption}</p>
            ) : null}
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase text-white/70">
              <Clock className="size-3.5" />
              {remainingLabel(viewingStory.expires_at)}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
