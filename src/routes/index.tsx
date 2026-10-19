import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpenCheck, GraduationCap, MessagesSquare, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";

import heroAsset from "@/assets/sekolah-1.jpg.asset.json";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StoredImage } from "@/components/StoredImage";
import { Button } from "@/components/ui/button";
import { useGallery } from "@/hooks/useGallery";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { SCHOOL_NAME, SCHOOL_TAGLINE } from "@/lib/school";
import { resolveImageSrc } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SMA Negeri 13 Buru — Website Resmi Sekolah" },
      {
        name: "description",
        content:
          "Website resmi SMA Negeri 13 Buru, Maluku. Profil sekolah, galeri kegiatan, dashboard data siswa & guru, serta ruang chat kelas.",
      },
      { property: "og:title", content: "SMA Negeri 13 Buru — Website Resmi Sekolah" },
      {
        property: "og:description",
        content: "Berprestasi, Berkarakter, Berbudaya. Kenali SMA Negeri 13 Buru lebih dekat.",
      },
    ],
  }),
  component: Beranda,
});

const KEUNGGULAN = [
  {
    icon: BookOpenCheck,
    title: "Pembelajaran Bermutu",
    text: "Kurikulum terkini dengan guru yang berdedikasi dan praktik laboratorium.",
  },
  {
    icon: Users,
    title: "Data Terpusat",
    text: "Data siswa dan guru tersimpan rapi dan bisa dipantau lewat dashboard.",
  },
  {
    icon: MessagesSquare,
    title: "Ruang Chat Kelas",
    text: "Siswa dan guru berdiskusi serta berbagi gambar dalam satu ruang kelas.",
  },
  {
    icon: ShieldCheck,
    title: "Akun Terverifikasi",
    text: "Setiap pendaftaran siswa dan guru disetujui langsung oleh admin sekolah.",
  },
];

function Beranda() {
  const { data: gallery } = useGallery(6);
  const { data: settings } = useSiteSettings();
  const hero = settings?.hero;

  const [heroSrc, setHeroSrc] = useState<string>(heroAsset.url);

  useEffect(() => {
    let active = true;
    if (hero?.image) {
      resolveImageSrc("school-images", hero.image).then((src) => {
        if (active && src) setHeroSrc(src);
      });
    } else {
      setHeroSrc(heroAsset.url);
    }
    return () => {
      active = false;
    };
  }, [hero?.image]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <BackgroundMusic />

      <section className="relative overflow-hidden bg-hero-gradient text-primary-foreground">
        <img
          src={heroSrc}
          alt={`Gedung ${SCHOOL_NAME}`}
          width={1600}
          height={912}
          className="absolute inset-0 size-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <span className="inline-block rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-accent-foreground">
            Kabupaten Buru — Maluku
          </span>
          <h1 className="mt-5 text-display text-4xl uppercase sm:text-6xl lg:text-7xl">
            {hero?.title || SCHOOL_NAME}
          </h1>
          <p className="mt-4 max-w-2xl text-lg font-extrabold uppercase tracking-wide text-accent sm:text-2xl">
            {hero?.tagline || SCHOOL_TAGLINE}
          </p>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-primary-foreground/85 sm:text-lg">
            {hero?.description ||
              "Sekolah menengah atas negeri yang membangun generasi cerdas, jujur, dan siap bersaing. Semua informasi sekolah, data siswa, data guru, dan komunikasi kelas ada di satu tempat."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="hero">
              <Link to="/auth">Masuk Dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="onDark">
              <Link to="/profil">Profil Sekolah</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-8 max-w-6xl px-4">
        <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 shadow-card sm:grid-cols-4 sm:p-6">
          {[
            { label: "Rombongan Belajar", value: "9" },
            { label: "Jurusan", value: "IPA & IPS" },
            { label: "Akreditasi", value: "B" },
            { label: "Tahun Berdiri", value: "2009" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <dt className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="text-display mt-1 text-2xl text-primary sm:text-3xl">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-display text-3xl uppercase text-primary sm:text-4xl">
          Keunggulan Kami
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KEUNGGULAN.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-card"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                <item.icon className="size-6" strokeWidth={2.4} />
              </span>
              <h3 className="mt-4 text-lg uppercase">{item.title}</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-secondary/60 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-display text-3xl uppercase text-primary sm:text-4xl">
              Galeri Sekolah
            </h2>
            <Button asChild variant="outline">
              <Link to="/galeri">Lihat Semua</Link>
            </Button>
          </div>

          {gallery && gallery.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item) => (
                <figure
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                >
                  <StoredImage
                    bucket="school-images"
                    value={item.image_url}
                    alt={item.title}
                    className="h-48 w-full object-cover"
                  />
                  <figcaption className="p-4">
                    <h3 className="text-base uppercase">{item.title}</h3>
                    {item.caption ? (
                      <p className="mt-1 text-sm font-semibold text-muted-foreground">
                        {item.caption}
                      </p>
                    ) : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Belum ada foto. Admin dapat menambahkannya dari dashboard.
            </p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl bg-hero-gradient p-8 text-primary-foreground shadow-strong sm:p-12">
          <GraduationCap className="size-10 text-accent" strokeWidth={2.4} />
          <h2 className="mt-4 text-display text-3xl uppercase sm:text-4xl">
            Sudah Punya Akun Sekolah?
          </h2>
          <p className="mt-3 max-w-xl text-base font-semibold text-primary-foreground/85">
            Masuk dengan username dan password Anda untuk melihat data kelas, data guru, dan ikut
            ruang chat kelas.
          </p>
          <Button asChild size="lg" variant="gold" className="mt-6">
            <Link to="/auth">Masuk / Daftar</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
