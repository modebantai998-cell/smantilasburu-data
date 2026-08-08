import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, SendHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { CLASSES, ROLE_LABEL } from "@/lib/school";
import { randomFileName } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/dashboard/chat")({
  component: ChatKelas;
});

type Message = {
  id: string;
  class_name: string;
  sender_id: string;
  body: string | null;
  image_url: string | null;
  created_at: string;
};

function ChatKelas() {
  const { profile, userId, isApproved, isAdmin, isGuru } = useMe();
  const queryClient = useQueryClient();
  const canPickClass = isAdmin || isGuru;
  const [kelas, setKelas] = useState<string>(profile?.class_name ?? CLASSES[0]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!canPickClass && profile?.class_name) setKelas(profile.class_name);
  }, [canPickClass, profile?.class_name]);

  const messages = useQuery({
    queryKey: ["messages", kelas],
    enabled: isApproved,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("class_name", kelas)
        .order("created_at", { ascending: true })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  const senders = useQuery({
    queryKey: ["sender-map"],
    enabled: isApproved,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, full_name, role");
      if (error) throw error;
      const map: Record<string, { full_name: string; role: string }> = {};
      for (const item of data ?? []) {
        map[item.id] = { full_name: item.full_name, role: item.role };
      }
      return map;
    },
  });

  useEffect(() => {
    if (!isApproved) return;
    const channel = supabase
      .channel(`chat-${kelas}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `class_name=eq.${kelas}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", kelas] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isApproved, kelas, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data?.length]);

  const send = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Sesi tidak ditemukan.");
      let imagePath: string | null = null;

      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 5 MB.");
        const path = `${userId}/${randomFileName(file.name)}`;
        const { error } = await supabase.storage.from("chat-images").upload(path, file);
        if (error) throw new Error("Gambar gagal diunggah.");
        imagePath = path;
      }

      const { error } = await supabase.from("messages").insert({
        class_name: kelas,
        sender_id: userId,
        body: body.trim() || null,
        image_url: imagePath,
      });
      if (error) throw new Error("Pesan gagal dikirim.");
    },
    onSuccess: () => {
      setBody("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["messages", kelas] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isApproved) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Chat kelas terbuka setelah akun Anda disetujui admin.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">
          Chat Kelas {kelas}
        </h1>
        {canPickClass ? (
          <Select value={kelas} onValueChange={setKelas}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map((item) => (
                <SelectItem key={item} value={item}>
                  Kelas {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <div className="flex h-[26rem] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-card">
        {messages.isLoading ? (
          <p className="text-center text-sm font-bold uppercase text-muted-foreground">
            Memuat pesan...
          </p>
        ) : (messages.data ?? []).length === 0 ? (
          <p className="my-auto text-center text-sm font-bold uppercase text-muted-foreground">
            Belum ada pesan di ruang kelas ini.
          </p>
        ) : (
          (messages.data ?? []).map((message) => {
            const mine = message.sender_id === userId;
            const sender = senders.data?.[message.sender_id];
            return (
              <div key={message.id} className={mine ? "self-end text-right" : "self-start"}>
                <p className="text-[11px] font-extrabold uppercase tracking-wide text-muted-foreground">
                  {sender ? sender.full_name : "Pengguna"}
                  {sender ? ` · ${ROLE_LABEL[sender.role]}` : ""}
                </p>
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
          placeholder="Tulis pesan untuk kelas ini..."
          rows={3}
          maxLength={1000}
          className="font-semibold"
        />

        {file ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
            <p className="flex-1 truncate text-xs font-extrabold uppercase">{file.name}</p>
            <Button type="button" size="icon" variant="ghost" onClick={() => setFile(null)}>
              <X />
            </Button>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
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
  );
}
