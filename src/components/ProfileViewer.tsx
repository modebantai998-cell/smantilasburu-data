import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, SendHorizontal, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMe, type Profile } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL } from "@/lib/school";
import { cn } from "@/lib/utils";

const OPEN_EVENT = "smantilas:open-profile";

/** Buka penayangan profil layar penuh (di luar tampilan dashboard). */
export function openProfileViewer(profileId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: profileId }));
}

type CommentRow = {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile: { full_name: string; role: string; avatar_url: string | null } | null;
};

export function ProfileViewer() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const { userId, isAdmin, isApproved } = useMe();
  const queryClient = useQueryClient();
  const commentsBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: Event) => setProfileId((event as CustomEvent<string>).detail);
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  const open = Boolean(profileId);
  const enabled = open && isApproved && Boolean(userId);

  useEffect(() => {
    if (!open) setComment("");
  }, [open]);

  const profile = useQuery({
    queryKey: ["viewer-profile", profileId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });

  const likeCount = useQuery({
    queryKey: ["viewer-like-count", profileId],
    enabled,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profile_likes")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profileId as string);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const liked = useQuery({
    queryKey: ["viewer-liked", profileId, userId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_likes")
        .select("id")
        .eq("profile_id", profileId as string)
        .eq("user_id", userId as string)
        .maybeSingle();
      if (error) throw error;
      return Boolean(data);
    },
  });

  const comments = useQuery({
    queryKey: ["viewer-comments", profileId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_comments")
        .select(
          "id, user_id, body, created_at, profile:profiles!profile_comments_user_id_fkey(id, full_name, role, avatar_url)",
        )
        .eq("profile_id", profileId as string)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as CommentRow[];
    },
  });

  // Pembaruan langsung saat ada yang menyukai / berkomentar.
  useEffect(() => {
    if (!enabled || !profileId) return;
    const channel = supabase
      .channel(`profile-social-${profileId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profile_likes", filter: `profile_id=eq.${profileId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["viewer-like-count", profileId] });
          queryClient.invalidateQueries({ queryKey: ["viewer-liked", profileId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profile_comments", filter: `profile_id=eq.${profileId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["viewer-comments", profileId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, profileId, queryClient]);

  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!userId || !profileId) throw new Error("Sesi tidak ditemukan.");
      if (liked.data) {
        const { error } = await supabase
          .from("profile_likes")
          .delete()
          .eq("profile_id", profileId)
          .eq("user_id", userId);
        if (error) throw new Error("Gagal membatalkan suka.");
      } else {
        const { error } = await supabase
          .from("profile_likes")
          .insert({ profile_id: profileId, user_id: userId });
        if (error) throw new Error("Gagal menyukai profil.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewer-like-count", profileId] });
      queryClient.invalidateQueries({ queryKey: ["viewer-liked", profileId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!userId || !profileId) throw new Error("Sesi tidak ditemukan.");
      const text = comment.trim();
      if (!text) throw new Error("Tulis komentar terlebih dahulu.");
      const { error } = await supabase
        .from("profile_comments")
        .insert({ profile_id: profileId, user_id: userId, body: text });
      if (error) throw new Error("Komentar gagal dikirim.");
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["viewer-comments", profileId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function removeComment(row: CommentRow) {
    const { error } = await supabase.from("profile_comments").delete().eq("id", row.id);
    if (error) {
      toast.error("Komentar gagal dihapus.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["viewer-comments", profileId] });
  }

  if (!open) return null;

  const data = profile.data ?? null;

  return (
    <div className="fixed inset-0 z-[110] overflow-y-auto bg-background/95 p-4 backdrop-blur-sm sm:p-8">
      <div className="mx-auto max-w-md overflow-hidden rounded-3xl border-2 border-primary/60 bg-card shadow-glow">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-widest text-primary">Profil</p>
          <button
            type="button"
            aria-label="Tutup profil"
            onClick={() => setProfileId(null)}
            className="grid size-9 place-items-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        {!isApproved ? (
          <p className="p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Profil pengguna terbuka setelah akun Anda disetujui admin.
          </p>
        ) : profile.isLoading ? (
          <div className="grid place-items-center p-16">
            <div className="size-32 animate-pulse rounded-full bg-secondary" />
          </div>
        ) : !data ? (
          <p className="p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Profil tidak ditemukan.
          </p>
        ) : (
          <>
            <div className="grid place-items-center gap-4 px-6 py-8 text-center">
              <span className="grid size-44 place-items-center rounded-full bg-hero-gradient p-1">
                <UserAvatar
                  avatarUrl={data.avatar_url}
                  fullName={data.full_name}
                  className="size-full border-0"
                />
              </span>
              <div>
                <h2 className="text-display text-2xl uppercase text-primary">{data.full_name}</h2>
                <p className="mt-1 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
                  {ROLE_LABEL[data.role]}
                  {data.class_name ? ` — Kelas ${data.class_name}` : ""}
                  {data.subject ? ` — ${data.subject}` : ""}
                </p>
                {data.member_id ? (
                  <p className="mt-1 font-mono text-xs font-bold text-muted-foreground">
                    {data.member_id}
                  </p>
                ) : null}
              </div>

              <Button
                variant={liked.data ? "gold" : "secondary"}
                onClick={() => toggleLike.mutate()}
                disabled={toggleLike.isPending}
                className="min-w-32"
              >
                <Heart className={cn(liked.data && "fill-current")} />
                {likeCount.data ?? 0} Suka
              </Button>
            </div>

            <div className="border-t border-border p-4">
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-primary">
                <MessageCircle className="size-4" />
                Komentar ({comments.data?.length ?? 0})
              </p>

              <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
                {comments.isLoading ? (
                  <p className="text-center text-xs font-bold uppercase text-muted-foreground">
                    Memuat komentar...
                  </p>
                ) : (comments.data ?? []).length === 0 ? (
                  <p className="text-center text-xs font-bold uppercase text-muted-foreground">
                    Belum ada komentar. Jadilah yang pertama!
                  </p>
                ) : (
                  (comments.data ?? []).map((row) => (
                    <div key={row.id} className="flex gap-2">
                      <UserAvatar
                        avatarUrl={row.profile?.avatar_url ?? null}
                        fullName={row.profile?.full_name ?? "Pengguna"}
                        className="size-8 shrink-0"
                      />
                      <div className="min-w-0 flex-1 rounded-xl bg-secondary px-3 py-2">
                        <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                          {row.profile?.full_name ?? "Pengguna"}
                          {row.profile ? ` · ${ROLE_LABEL[row.profile.role]}` : ""}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed">
                          {row.body}
                        </p>
                      </div>
                      {(row.user_id === userId || isAdmin) ? (
                        <button
                          type="button"
                          aria-label="Hapus komentar"
                          onClick={() => removeComment(row)}
                          className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  ))
                )}
                <div ref={commentsBottomRef} />
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  addComment.mutate();
                }}
                className="mt-3 flex gap-2"
              >
                <Input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tulis komentar..."
                  maxLength={500}
                  className="font-semibold"
                />
                <Button type="submit" size="icon" variant="gold" disabled={addComment.isPending} aria-label="Kirim komentar">
                  <SendHorizontal />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
