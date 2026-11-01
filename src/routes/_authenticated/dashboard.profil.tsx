import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, STATUS_LABEL } from "@/lib/school";
import { randomFileName } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/dashboard/profil")({
  component: ProfilSaya,
});

function ProfilSaya() {
  const { profile, userId, refetch } = useMe();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [busy, setBusy] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setAddress(profile.address ?? "");
    setGender(profile.gender ?? "");
  }, [profile]);

  if (!profile) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase text-muted-foreground">
        Memuat profil...
      </p>
    );
  }

  async function uploadAvatar(file: File) {
    if (!userId) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Berkas harus berupa gambar.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 5 MB.");
      return;
    }

    setAvatarBusy(true);
    try {
      const path = `${userId}/avatar-${randomFileName(file.name)}`;
      const { error } = await supabase.storage.from("chat-images").upload(path, file, {
        upsert: true,
      });
      if (error) throw new Error("Foto gagal diunggah.");

      if (profile?.avatar_url && profile.avatar_url !== path) {
        await supabase.storage.from("chat-images").remove([profile.avatar_url]).catch(() => undefined);
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", userId);
      if (updateError) throw new Error("Foto gagal disimpan ke profil.");

      queryClient.invalidateQueries({ queryKey: ["avatar-src"] });
      await refetch();
      toast.success("Foto profil diperbarui.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Foto gagal diunggah.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    if (fullName.trim().length < 3) {
      toast.error("Nama lengkap minimal 3 karakter.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          gender: gender.trim() || null,
        })
        .eq("id", userId);
      if (error) throw new Error("Profil gagal disimpan.");
      await refetch();
      toast.success("Profil tersimpan.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profil gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">Profil Saya</h1>

      <section className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="relative">
          <UserAvatar
            avatarUrl={profile.avatar_url}
            fullName={profile.full_name}
            className="size-24 border-4 border-accent text-2xl"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarBusy}
            aria-label="Ganti foto profil"
            className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform hover:scale-105 disabled:opacity-60"
          >
            <Camera className="size-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadAvatar(file);
              event.target.value = "";
            }}
          />
        </div>

        <div className="space-y-1">
          <p className="text-display text-xl uppercase text-primary">{profile.full_name}</p>
          <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {ROLE_LABEL[profile.role]}
            {profile.class_name ? ` — Kelas ${profile.class_name}` : ""}
            {profile.subject ? ` — ${profile.subject}` : ""}
          </p>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Status: {STATUS_LABEL[profile.status]}
            {profile.blocked ? " — Diblokir" : ""}
          </p>
          <p className="font-mono text-xs font-bold text-muted-foreground">
            {profile.username} · {profile.member_id}
          </p>
        </div>
      </section>

      <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-extrabold uppercase">Ubah Data Profil</h2>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Username dan peran tidak dapat diubah.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pf-name" className="uppercase">
              Nama Lengkap
            </Label>
            <Input
              id="pf-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-gender" className="uppercase">
              Jenis Kelamin (L/P)
            </Label>
            <Input
              id="pf-gender"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              maxLength={20}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-phone" className="uppercase">
              Nomor Telepon
            </Label>
            <Input
              id="pf-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={25}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-address" className="uppercase">
              Alamat
            </Label>
            <Input
              id="pf-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        <Button type="submit" variant="gold" className="mt-5" disabled={busy}>
          <Save />
          {busy ? "Menyimpan..." : "Simpan Profil"}
        </Button>
      </form>
    </div>
  );
}
