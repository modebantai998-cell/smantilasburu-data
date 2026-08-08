import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, MessagesSquare, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, SCHOOL_NAME, STATUS_LABEL } from "@/lib/school";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { profile, isAdmin, isApproved } = useMe();

  const stats = useQuery({
    queryKey: ["dashboard-stats"],
    enabled: isApproved,
    queryFn: async () => {
      const [siswa, guru, pending] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "siswa")
          .eq("status", "approved"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "guru")
          .eq("status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        siswa: siswa.count ?? 0,
        guru: guru.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Siswa Aktif", value: stats.data?.siswa ?? 0, icon: Users },
    { label: "Guru Aktif", value: stats.data?.guru ?? 0, icon: GraduationCap },
    { label: "Menunggu Persetujuan", value: stats.data?.pending ?? 0, icon: UserCheck },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">
          Selamat Datang, {profile?.full_name ?? "Pengguna"}
        </h1>
        <p className="mt-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {ROLE_LABEL[profile?.role ?? "siswa"]} — {STATUS_LABEL[profile?.status ?? "pending"]}
          {profile?.class_name ? ` — Kelas ${profile.class_name}` : ""}
          {profile?.subject ? ` — ${profile.subject}` : ""}
        </p>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">
          Dashboard {SCHOOL_NAME} menampilkan data siswa, data guru, dan ruang chat kelas dalam satu
          tempat.
        </p>
      </section>

      {isApproved ? (
        <section className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <card.icon className="size-6" strokeWidth={2.4} />
              </span>
              <p className="mt-4 text-[11px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
                {card.label}
              </p>
              <p className="text-display text-4xl text-primary">{card.value}</p>
            </article>
          ))}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        {isApproved ? (
          <article className="rounded-2xl bg-hero-gradient p-6 text-primary-foreground shadow-strong">
            <MessagesSquare className="size-9 text-accent" strokeWidth={2.4} />
            <h2 className="mt-3 text-display text-2xl uppercase">Ruang Chat Kelas</h2>
            <p className="mt-2 text-sm font-semibold text-primary-foreground/85">
              Berdiskusi dan kirim gambar bersama teman kelas serta guru.
            </p>
            <Button asChild variant="gold" className="mt-4">
              <Link to="/dashboard/chat">Buka Chat</Link>
            </Button>
          </article>
        ) : null}

        {isAdmin ? (
          <article className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <UserCheck className="size-9 text-primary" strokeWidth={2.4} />
            <h2 className="mt-3 text-display text-2xl uppercase text-primary">Persetujuan Akun</h2>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              Tinjau pendaftaran siswa dan guru baru, lalu setujui atau tolak.
            </p>
            <Button asChild className="mt-4">
              <Link to="/dashboard/persetujuan">Tinjau Pendaftaran</Link>
            </Button>
          </article>
        ) : null}
      </section>
    </div>
  );
}
