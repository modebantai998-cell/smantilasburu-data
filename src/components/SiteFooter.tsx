import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

import { SCHOOL_NAME, SCHOOL_TAGLINE } from "@/lib/school";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-primary-deep text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <h2 className="text-display text-xl uppercase">{SCHOOL_NAME}</h2>
          <p className="mt-2 text-sm font-semibold text-primary-foreground/70">{SCHOOL_TAGLINE}</p>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-widest text-accent">Kontak</h3>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-primary-foreground/80">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
              Kabupaten Buru, Provinsi Maluku
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
              (0913) 000 000
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
              info@sman13buru.sch.id
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm uppercase tracking-widest text-accent">Tautan</h3>
          <ul className="mt-3 space-y-2 text-sm font-bold uppercase tracking-wide">
            <li>
              <Link to="/profil" className="hover:text-accent">
                Profil Sekolah
              </Link>
            </li>
            <li>
              <Link to="/galeri" className="hover:text-accent">
                Galeri Kegiatan
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-accent">
                Masuk Dashboard
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs font-bold uppercase tracking-widest text-primary-foreground/60">
        © {new Date().getFullYear()} {SCHOOL_NAME}
      </div>
    </footer>
  );
}
