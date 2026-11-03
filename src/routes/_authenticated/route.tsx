import { Link, Outlet, createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Award,
  GraduationCap,
  Images,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  MessageCircle,
  Newspaper,
  Palette,
  ShieldBan,
  Sparkles,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";

import { BannerCarousel } from "@/components/BannerCarousel";
import { SchoolLogo } from "@/components/SchoolLogo";
import { RecoveryBanner } from "@/components/RecoveryBanner";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL, SCHOOL_SHORT, STATUS_LABEL } from "@/lib/school";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: DashboardShell,
});

function DashboardShell() {
  const { profile, isAdmin, isApproved, isBlocked, loading } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = [
    { to: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, show: true },
    { to: "/dashboard/profil", label: "Profil Saya", icon: UserRound, show: true },
    { to: "/dashboard/chat", label: "Chat Kelas", icon: MessagesSquare, show: isApproved },
    { to: "/dashboard/pesan", label: "Pesan Pribadi", icon: MessageCircle, show: isApproved },
    { to: "/dashboard/story", label: "Story", icon: Sparkles, show: isApproved },
    { to: "/dashboard/nilai", label: "Nilai", icon: Award, show: isApproved },
    { to: "/dashboard/berita", label: "Berita", icon: Newspaper, show: isApproved },
    { to: "/dashboard/siswa", label: "Data Siswa", icon: Users, show: isApproved },
    { to: "/dashboard/guru", label: "Data Guru", icon: GraduationCap, show: isApproved },
    { to: "/dashboard/persetujuan", label: "Persetujuan", icon: UserCheck, show: isAdmin },
    { to: "/dashboard/galeri", label: "Kelola Galeri", icon: Images, show: isAdmin },
    { to: "/dashboard/tampilan", label: "Kelola Tampilan", icon: Palette, show: isAdmin },
    { to: "/dashboard/akun", label: "Kelola Akun", icon: ShieldBan, show: isAdmin },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-primary-deep text-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <SchoolLogo className="size-12" />
            <span className="text-display text-xl uppercase leading-none sm:text-2xl">{SCHOOL_SHORT}</span>
          </Link>
          <span className="hidden rounded-full border border-primary/60 bg-primary/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-primary shadow-glow md:inline-block">
            {profile?.role === "admin" ? "Administrator • Sekolah Admin" : profile?.role === "guru" ? "Guru • Akun Resmi" : "Siswa • SMANTILAS"}
          </span>
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={profile?.avatar_url ?? null}
              fullName={profile?.full_name ?? "Pengguna"}
              className="size-10 border-primary"
            />
            <div className="text-right">
              <p className="text-sm font-extrabold uppercase leading-tight">
                {profile?.full_name ?? "Pengguna"}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                {ROLE_LABEL[profile?.role ?? "siswa"]}
                {profile?.class_name ? ` — ${profile.class_name}` : ""}
              </p>
              {profile?.member_id ? (
                <p className="font-mono text-[11px] font-bold">{profile.member_id}</p>
              ) : null}
            </div>
            <Button variant="onDark" size="sm" onClick={handleSignOut}>
              <LogOut />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <BannerCarousel className="mb-5" />
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:flex-wrap">
          {links
            .filter((link) => link.show)
            .map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/dashboard" }}
                activeProps={{ className: "!bg-primary !text-primary-foreground !border-primary shadow-glow" }}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-foreground transition-colors hover:bg-secondary"
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            ))}
        </nav>

        {!loading && profile && isBlocked ? <RecoveryBanner memberId={profile.member_id} userId={profile.id} /> : null}

        {!loading && profile && !isApproved && !isBlocked ? (
          <p className="mt-5 rounded-xl border border-accent/50 bg-accent/15 p-4 text-sm font-extrabold uppercase leading-relaxed tracking-wide text-foreground">
            Status akun: {STATUS_LABEL[profile.status]}. Akses data dan chat kelas terbuka setelah
            admin menyetujui akun Anda.
          </p>
        ) : null}

        <main className="mt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
