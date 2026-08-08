import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminAccount } from "@/lib/admin.functions";
import { CLASSES, SCHOOL_NAME, SUBJECTS, normalizeUsername, usernameToEmail } from "@/lib/school";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk & Daftar Akun — SMA Negeri 13 Buru" },
      {
        name: "description",
        content:
          "Masuk ke dashboard SMA Negeri 13 Buru dengan username dan password, atau daftar sebagai siswa maupun guru.",
      },
      { property: "og:title", content: "Masuk & Daftar Akun — SMA Negeri 13 Buru" },
      {
        property: "og:description",
        content: "Login dashboard sekolah untuk siswa, guru, dan admin SMA Negeri 13 Buru.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  useEffect(() => {
    ensureAdminAccount().catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero-gradient py-12 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-display text-3xl uppercase sm:text-4xl">Portal Akun Sekolah</h1>
          <p className="mt-2 text-base font-semibold text-primary-foreground/85">
            {SCHOOL_NAME} — gunakan username dan password Anda.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" className="font-bold uppercase">
                Masuk
              </TabsTrigger>
              <TabsTrigger value="daftar" className="font-bold uppercase">
                Daftar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="pt-6">
              <LoginForm onDone={() => navigate({ to: "/dashboard" })} />
            </TabsContent>

            <TabsContent value="daftar" className="pt-6">
              <RegisterForm onDone={() => navigate({ to: "/dashboard" })} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function LoginForm({ onDone }: { onDone: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await ensureAdminAccount().catch(() => undefined);
      const { error } = await supabase.auth.signInWithPassword({
        email: usernameToEmail(normalizeUsername(username)),
        password,
      });
      if (error) {
        toast.error("Username atau password salah.");
        return;
      }
      toast.success("Berhasil masuk.");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-username" className="uppercase">
          Username
        </Label>
        <Input
          id="login-username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
          maxLength={40}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password" className="uppercase">
          Password
        </Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          maxLength={72}
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [role, setRole] = useState<"siswa" | "guru">("siswa");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [className, setClassName] = useState<string>(CLASSES[0]);
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanUsername = normalizeUsername(username);
    if (cleanUsername.length < 4) {
      toast.error("Username minimal 4 karakter tanpa spasi.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password minimal 6 karakter.");
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: usernameToEmail(cleanUsername),
        password,
      });
      if (error || !data.user) {
        toast.error(
          error?.message.includes("already")
            ? "Username sudah dipakai. Silakan pilih yang lain."
            : "Pendaftaran gagal. Coba lagi.",
        );
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        username: cleanUsername,
        full_name: fullName.trim(),
        role,
        status: "pending",
        class_name: role === "siswa" ? className : null,
        subject: role === "guru" ? subject : null,
        id_number: idNumber.trim() || null,
      });

      if (profileError) {
        toast.error("Data pendaftaran gagal disimpan.");
        return;
      }

      toast.success("Pendaftaran terkirim. Tunggu persetujuan admin sekolah.");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label className="uppercase">Daftar Sebagai</Label>
        <Select value={role} onValueChange={(value) => setRole(value as "siswa" | "guru")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="siswa">Siswa</SelectItem>
            <SelectItem value="guru">Guru</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="reg-name" className="uppercase">
          Nama Lengkap
        </Label>
        <Input
          id="reg-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="reg-username" className="uppercase">
            Username
          </Label>
          <Input
            id="reg-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
            maxLength={40}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-password" className="uppercase">
            Password
          </Label>
          <Input
            id="reg-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
            maxLength={72}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="reg-id" className="uppercase">
            {role === "siswa" ? "NISN" : "NIP"} (opsional)
          </Label>
          <Input
            id="reg-id"
            value={idNumber}
            onChange={(event) => setIdNumber(event.target.value)}
            maxLength={30}
          />
        </div>

        {role === "siswa" ? (
          <div className="space-y-1.5">
            <Label className="uppercase">Kelas</Label>
            <Select value={className} onValueChange={setClassName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="uppercase">Mata Pelajaran</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <p className="rounded-lg bg-secondary p-3 text-xs font-bold uppercase leading-relaxed tracking-wide text-secondary-foreground">
        Akun baru harus disetujui admin sekolah sebelum dapat mengakses data dan chat kelas.
      </p>

      <Button type="submit" size="lg" variant="gold" className="w-full" disabled={busy}>
        {busy ? "Mengirim..." : "Kirim Pendaftaran"}
      </Button>
    </form>
  );
}
