import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, MessageCircle, SendHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { StoredImage } from "@/components/StoredImage";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL } from "@/lib/school";
import { randomFileName } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/dashboard/pesan")({
  component: PesanPribadi,
});

type Contact = {
  id: string;
  full_name: string;
  role: string;
  class_name: string | null;
  avatar_url: string | null;
};

type DirectMessage = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
};

function PesanPribadi() {
  const { userId, isApproved } = useMe();
  const queryClient = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const contacts = useQuery({
    queryKey: ["dm-contacts"],
    enabled: isApproved && Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, class_name, avatar_url")
        .eq("status", "approved")
        .neq("id", userId as string)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Contact[];
    },
  });

  const unread = useQuery({
    queryKey: ["dm-unread"],
    enabled: isApproved && Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("sender_id")
        .eq("recipient_id", userId as string)
        .is("read_at", null);
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) counts[row.sender_id] = (counts[row.sender_id] ?? 0) + 1;
      return counts;
    },
  });

  const conversation = useQuery({
    queryKey: ["dm-conversation", active],
    enabled: isApproved && Boolean(active) && Boolean(userId),
    queryFn: async () => {
      const me = userId as string;
      const contact = active as string;
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${me},recipient_id.eq.${contact}),and(sender_id.eq.${contact},recipient_id.eq.${me})`,
        )
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as DirectMessage[];
    },
  });

  useEffect(() => {
    if (!isApproved || !userId) return;
    const channel = supabase
      .channel("dm-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages", filter: `recipient_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dm-unread"] });
          queryClient.invalidateQueries({ queryKey: ["dm-conversation"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages", filter: `sender_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dm-conversation"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isApproved, userId, queryClient]);

  // Tandai pesan dari kontak aktif sudah dibaca.
  useEffect(() => {
    if (!userId || !active || !conversation.data?.length) return;
    const unreadFromContact = conversation.data.some(
      (message) => message.recipient_id === userId && !message.read_at,
    );
    if (!unreadFromContact) return;

    supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .eq("sender_id", active)
      .is("read_at", null)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["dm-unread"] });
      });
  }, [userId, active, conversation.data, queryClient]);

  const send = useMutation({
    mutationFn: async () => {
      if (!userId || !active) throw new Error("Pilih penerima pesan.");
      if (!body.trim() && !file) throw new Error("Tulis pesan atau pilih gambar.");

      let imagePath: string | null = null;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 5 MB.");
        const path = `${userId}/${randomFileName(file.name)}`;
        const { error } = await supabase.storage.from("chat-images").upload(path, file);
        if (error) throw new Error("Gambar gagal diunggah.");
        imagePath = path;
      }

      const { error } = await supabase.from("direct_messages").insert({
        sender_id: userId,
        recipient_id: active,
        body: body.trim() || null,
        image_url: imagePath,
      });
      if (error) throw new Error("Pesan gagal dikirim.");
    },
    onSuccess: () => {
      setBody("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["dm-conversation", active] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.data?.length, active]);

  const contactById = useMemo(
    () => Object.fromEntries((contacts.data ?? []).map((c) => [c.id, c])),
    [contacts.data],
  );
  const activeContact = active ? contactById[active] : undefined;

  if (!isApproved) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Pesan pribadi terbuka setelah akun Anda disetujui admin.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">Pesan Pribadi</h1>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Chat pribadi satu lawan satu — hanya Anda dan penerima yang bisa membacanya.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="max-h-[30rem] space-y-1 overflow-y-auto rounded-2xl border border-border bg-card p-3 shadow-card lg:max-h-none">
          <p className="px-1 pb-2 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Kontak Tersedia
          </p>
          {contacts.isLoading ? (
            <p className="px-1 text-sm font-bold uppercase text-muted-foreground">Memuat...</p>
          ) : (contacts.data ?? []).length === 0 ? (
            <p className="px-1 text-sm font-bold uppercase text-muted-foreground">
              Belum ada pengguna lain yang disetujui.
            </p>
          ) : (
            (contacts.data ?? []).map((contact) => {
              const count = unread.data?.[contact.id] ?? 0;
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => setActive(contact.id)}
                  className={`flex w-full items-center gap-2 rounded-xl p-2 text-left transition-colors ${
                    active === contact.id ? "bg-secondary" : "hover:bg-secondary/60"
                  }`}
                >
                  <UserAvatar
                    avatarUrl={contact.avatar_url}
                    fullName={contact.full_name}
                    className="size-9"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">
                      {contact.full_name}
                    </span>
                    <span className="block truncate text-[11px] font-bold uppercase text-muted-foreground">
                      {ROLE_LABEL[contact.role]}
                      {contact.class_name ? ` ${contact.class_name}` : ""}
                    </span>
                  </span>
                  {count > 0 ? (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-extrabold text-primary-foreground">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </aside>

        {active && activeContact ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-hero-gradient p-3 text-primary-foreground">
              <UserAvatar
                avatarUrl={activeContact.avatar_url}
                fullName={activeContact.full_name}
                className="size-10 border-accent"
              />
              <div>
                <p className="text-sm font-extrabold uppercase leading-tight">
                  {activeContact.full_name}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                  {ROLE_LABEL[activeContact.role]}
                  {activeContact.class_name ? ` ${activeContact.class_name}` : ""}
                </p>
              </div>
            </div>

            <div className="flex h-[24rem] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-card">
              {conversation.isLoading ? (
                <p className="my-auto text-center text-sm font-bold uppercase text-muted-foreground">
                  Memuat pesan...
                </p>
              ) : (conversation.data ?? []).length === 0 ? (
                <p className="my-auto flex flex-col items-center gap-2 text-center text-sm font-bold uppercase text-muted-foreground">
                  <MessageCircle className="size-8" />
                  Belum ada pesan. Mulai percakapan pribadi!
                </p>
              ) : (
                (conversation.data ?? []).map((message) => {
                  const mine = message.sender_id === userId;
                  return (
                    <div key={message.id} className={mine ? "self-end text-right" : "self-start"}>
                      <div
                        className={`mt-1 max-w-md rounded-2xl px-4 py-2.5 text-sm font-semibold leading-relaxed ${
                          mine
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {message.image_url ? (
                          <StoredImage
                            bucket="chat-images"
                            value={message.image_url}
                            alt="Lampiran gambar"
                            className="mb-2 max-h-56 w-full rounded-lg object-cover"
                          />
                        ) : null}
                        {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
                      </div>
                      <p className="mt-1 text-[10px] font-bold uppercase text-muted-foreground">
                        {new Date(message.created_at).toLocaleString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "short",
                        })}
                        {mine ? " · Terkirim" : ""}
                      </p>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!body.trim() && !file) {
                  toast.error("Tulis pesan atau pilih gambar.");
                  return;
                }
                send.mutate();
              }}
              className="rounded-2xl border border-border bg-card p-4 shadow-card"
            >
              <Textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={`Pesan pribadi untuk ${activeContact.full_name}...`}
                rows={2}
                maxLength={1000}
                className="font-semibold"
              />

              {file ? (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
                  <p className="flex-1 truncate text-xs font-extrabold uppercase">{file.name}</p>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setFile(null)}
                  >
                    <X />
                  </Button>
                </div>
              ) : null}

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-extrabold uppercase tracking-wide hover:bg-secondary">
                  <ImagePlus className="size-4" />
                  Kirim Gambar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <Button type="submit" variant="gold" disabled={send.isPending}>
                  <SendHorizontal />
                  {send.isPending ? "Mengirim..." : "Kirim"}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card text-center shadow-card">
            <MessageCircle className="size-10 text-muted-foreground" />
            <p className="max-w-xs text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Pilih kontak di sebelah kiri untuk memulai pesan pribadi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
