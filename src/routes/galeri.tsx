import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StoredImage } from "@/components/StoredImage";
import { useGallery } from "@/hooks/useGallery";

export const Route = createFileRoute("/galeri")({
  head: () => ({
    meta: [
      { title: "Galeri Kegiatan — SMA Negeri 13 Buru" },
      {
        name: "description",
        content:
          "Kumpulan foto kegiatan belajar, upacara, laboratorium, dan lingkungan sekolah SMA Negeri 13 Buru.",
      },
      { property: "og:title", content: "Galeri Kegiatan — SMA Negeri 13 Buru" },
      {
        property: "og:description",
        content: "Foto kegiatan dan lingkungan SMA Negeri 13 Buru.",
      },
    ],
  }),
  component: GaleriPage,
});

function GaleriPage() {
  const { data, isLoading } = useGallery();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="bg-hero-gradient py-14 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-display text-4xl uppercase sm:text-5xl">Galeri Sekolah</h1>
          <p className="mt-3 text-base font-semibold text-primary-foreground/85">
            Foto kegiatan dan fasilitas sekolah. Dikelola langsung oleh admin sekolah.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <div key={key} className="h-56 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((item) => (
              <figure
                key={item.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
              >
                <StoredImage
                  bucket="school-images"
                  value={item.image_url}
                  alt={item.title}
                  className="h-52 w-full object-cover"
                />
                <figcaption className="p-4">
                  <h2 className="text-base uppercase">{item.title}</h2>
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
          <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Belum ada foto pada galeri.
          </p>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}
