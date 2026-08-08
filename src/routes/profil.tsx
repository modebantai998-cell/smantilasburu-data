import { createFileRoute } from "@tanstack/react-router";
import { Flag, Target, Trophy } from "lucide-react";

import galeri2 from "@/assets/sekolah-2.jpg.asset.json";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SCHOOL_NAME, SCHOOL_TAGLINE } from "@/lib/school";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil Sekolah — SMA Negeri 13 Buru" },
      {
        name: "description",
        content:
          "Visi, misi, sejarah singkat, dan sambutan kepala sekolah SMA Negeri 13 Buru di Kabupaten Buru, Maluku.",
      },
      { property: "og:title", content: "Profil Sekolah — SMA Negeri 13 Buru" },
      {
        property: "og:description",
        content: "Visi, misi, dan sambutan kepala sekolah SMA Negeri 13 Buru.",
      },
    ],
  }),
  component: ProfilPage,
});

const MISI = [
  "Menyelenggarakan pembelajaran aktif, kreatif, dan menyenangkan.",
  "Menanamkan nilai iman, kejujuran, dan kedisiplinan pada seluruh peserta didik.",
  "Mengembangkan bakat siswa melalui kegiatan ekstrakurikuler yang terarah.",
  "Membangun budaya literasi dan penguasaan teknologi informasi.",
  "Menjalin kerja sama yang erat dengan orang tua dan masyarakat Kabupaten Buru.",
];

function ProfilPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero-gradient py-14 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-display text-4xl uppercase sm:text-5xl">Profil Sekolah</h1>
          <p className="mt-3 text-base font-extrabold uppercase tracking-wide text-accent">
            {SCHOOL_NAME} — {SCHOOL_TAGLINE}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
            <Flag className="size-6" strokeWidth={2.4} />
          </span>
          <h2 className="mt-4 text-2xl uppercase">Visi</h2>
          <p className="mt-3 text-lg font-bold leading-relaxed text-foreground">
            Terwujudnya peserta didik yang beriman, berprestasi, berkarakter, dan berbudaya serta
            mampu bersaing di tingkat regional maupun nasional.
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
            <Target className="size-6" strokeWidth={2.4} />
          </span>
          <h2 className="mt-4 text-2xl uppercase">Misi</h2>
          <ol className="mt-3 space-y-2.5">
            {MISI.map((item, index) => (
              <li key={item} className="flex gap-3 text-sm font-semibold leading-relaxed">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-xs font-extrabold text-primary-foreground">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </article>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="grid gap-6 overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:grid-cols-2">
          <img
            src={galeri2.url}
            alt="Kegiatan belajar mengajar di SMA Negeri 13 Buru"
            loading="lazy"
            width={1600}
            height={912}
            className="h-full w-full object-cover"
          />
          <div className="p-6 sm:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
              <Trophy className="size-6" strokeWidth={2.4} />
            </span>
            <h2 className="mt-4 text-2xl uppercase">Sambutan Kepala Sekolah</h2>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">
              Assalamualaikum dan salam sejahtera. Selamat datang di website resmi{" "}
              {SCHOOL_NAME}. Website ini kami hadirkan sebagai jembatan informasi antara sekolah,
              peserta didik, dan orang tua. Melalui dashboard sekolah, data siswa dan guru dapat
              dikelola dengan tertib, sementara ruang chat kelas memudahkan komunikasi belajar
              setiap hari.
            </p>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-muted-foreground">
              Kami berkomitmen menghadirkan layanan pendidikan yang bermutu bagi seluruh masyarakat
              Kabupaten Buru. Mari bersama membangun sekolah yang berprestasi, berkarakter, dan
              berbudaya.
            </p>
            <p className="mt-5 text-sm font-extrabold uppercase tracking-wide text-primary">
              Kepala {SCHOOL_NAME}
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
