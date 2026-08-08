import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SCHOOL_NAME } from "@/lib/school";

export const Route = createFileRoute("/kontak")({
  head: () => ({
    meta: [
      { title: "Kontak & Alamat — SMA Negeri 13 Buru" },
      {
        name: "description",
        content:
          "Alamat, nomor telepon, email, dan jam layanan SMA Negeri 13 Buru di Kabupaten Buru, Maluku.",
      },
      { property: "og:title", content: "Kontak & Alamat — SMA Negeri 13 Buru" },
      {
        property: "og:description",
        content: "Hubungi SMA Negeri 13 Buru melalui telepon, email, atau kunjungi sekolah.",
      },
    ],
  }),
  component: KontakPage,
});

const KONTAK = [
  { icon: MapPin, label: "Alamat", value: "Kabupaten Buru, Provinsi Maluku, Indonesia" },
  { icon: Phone, label: "Telepon", value: "(0913) 000 000" },
  { icon: Mail, label: "Email", value: "info@sman13buru.sch.id" },
  { icon: Clock, label: "Jam Layanan", value: "Senin – Jumat, 07.30 – 14.30 WIT" },
];

function KontakPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero-gradient py-14 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-display text-4xl uppercase sm:text-5xl">Kontak Sekolah</h1>
          <p className="mt-3 text-base font-semibold text-primary-foreground/85">
            Silakan hubungi {SCHOOL_NAME} untuk informasi pendaftaran dan layanan akademik.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:grid-cols-2">
        {KONTAK.map((item) => (
          <article
            key={item.label}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <item.icon className="size-6" strokeWidth={2.4} />
            </span>
            <h2 className="mt-4 text-sm uppercase tracking-widest text-muted-foreground">
              {item.label}
            </h2>
            <p className="mt-1 text-lg font-extrabold leading-snug">{item.value}</p>
          </article>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
