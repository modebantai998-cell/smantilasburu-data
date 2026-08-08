import { Link } from "@tanstack/react-router";
import { GraduationCap, Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { SCHOOL_NAME, SCHOOL_SHORT } from "@/lib/school";

const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/profil", label: "Profil" },
  { to: "/galeri", label: "Galeri" },
  { to: "/kontak", label: "Kontak" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { userId } = useMe();

  return (
    <header className="sticky top-0 z-50 border-b border-primary-deep/40 bg-primary-deep text-primary-foreground">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-gradient text-accent-foreground">
            <GraduationCap className="size-6" strokeWidth={2.6} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-display text-base uppercase sm:text-lg">
              {SCHOOL_NAME}
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
              {SCHOOL_SHORT}
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wide text-primary-foreground/80 transition-colors hover:bg-white/10 hover:text-primary-foreground"
              activeProps={{ className: "bg-white/15 text-primary-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Button asChild variant="gold" size="sm" className="ml-auto md:ml-2">
          <Link to={userId ? "/dashboard" : "/auth"}>{userId ? "Dashboard" : "Masuk"}</Link>
        </Button>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Buka menu"
          className="grid size-9 place-items-center rounded-lg bg-white/10 md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-white/10 px-4 pb-3 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-bold uppercase tracking-wide text-primary-foreground/85"
              activeProps={{ className: "bg-white/15 text-primary-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
