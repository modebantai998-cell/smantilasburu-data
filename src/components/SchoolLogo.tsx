import { cn } from "@/lib/utils";

/** Logo perisai neon SMANTILAS BURU (buku + bintang). */
export function SchoolLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 72" className={cn("size-11 shrink-0 drop-shadow-[0_0_10px_var(--primary)]", className)} aria-hidden="true">
      <defs>
        <linearGradient id="shield-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--primary-deep)" />
        </linearGradient>
      </defs>
      <path d="M32 3 58 12v22c0 17-11 28-26 35C17 62 6 51 6 34V12Z" fill="url(#shield-g)" stroke="var(--primary)" strokeWidth="3" />
      <path d="M32 10 51 17v17c0 13-8 22-19 28-11-6-19-15-19-28V17Z" fill="var(--background)" opacity="0.55" />
      <path d="m32 16 2.4 5 5.4.6-4 3.7 1.1 5.3L32 28l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6Z" fill="var(--primary)" />
      <path d="M17 38c6-2 11-1 15 2 4-3 9-4 15-2v12c-6-2-11-1-15 2-4-3-9-4-15-2Z" fill="var(--foreground)" />
      <path d="M32 40v12" stroke="var(--primary-deep)" strokeWidth="1.5" />
    </svg>
  );
}
