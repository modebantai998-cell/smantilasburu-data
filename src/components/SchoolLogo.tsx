import logo from "@/assets/smantilas-logo.png.asset.json";
import { cn } from "@/lib/utils";

/** Logo resmi SMAN 13 Buru (SMANTILAS). */
export function SchoolLogo({ className }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="Logo SMANTILAS"
      className={cn("size-11 shrink-0 object-contain drop-shadow-[0_0_8px_var(--primary)]", className)}
    />
  );
}
