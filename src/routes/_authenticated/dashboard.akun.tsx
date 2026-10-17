import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL } from "@/lib/school";

export const Route = createFileRoute("/_authenticated/dashboard/akun")({
  component: KelolaAkun,
});

function KelolaAkun() {
  const { isAdmin, userId } = useMe();
  const queryClient = useQueryClient();

  const data = useQuery({
    queryKey: ["admin-akun"],
    enabled: isAdmin,
    queryFn: async () => {
      const [profiles, requests, news] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("recovery_requests").select("*").order("created_at"),
        supabase.from("news").select("id, caption, author_id").order("created_at", { ascending: false }),
      ]);
      return {
        profiles: profiles.data ?? [],
        requests: requests.data ?? [],
        news: news.data ?? [],
      };
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-akun"] });

  async function setBlocked(id: string, blocked: boolean) {
    if (id === userId) { toast.error("Admin tidak bisa memblokir diri sendiri."); return; }
    const { error } = await supabase.from("profiles").update({ blocked }).eq("id", id);
    if (error) { toast.error("Gagal mengubah status."); return; }
    if (!blocked) await supabase.from("recovery_requests").delete().eq("user_id", id);
    toast.success(blocked ? "Akun diblokir." : "Akun dipulihkan.");
    refresh();
  }

  async function deleteNews(id: string) {
    await supabase.from("news").delete().eq("id", id);
    refresh();
  }

  if (!isAdmin) return null;
  const profiles = data.data?.profiles ?? [];
  const byId = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const stats = [
    ["Akun", profiles.length],
    ["Admin", profiles.filter((p) => p.role === "admin").length],
    ["Berita", data.data?.news.length ?? 0],
    ["Diblokir", profiles.filter((p) => p.blocked).length],
  ] as const;

  return (
    <div className="space-y-6">
      <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">Kelola Akun</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-card p-4 text-center shadow-card">
            <p className="text-display text-3xl text-primary">{value}</p>
            <p className="text-xs font-extrabold uppercase">{label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-accent/50 bg-accent/15 p-4">
        <h2 className="font-extrabold uppercase">
          Pengajuan Pemulihan ({data.data?.requests.length ?? 0})
        </h2>
        {(data.data?.requests ?? []).length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-muted-foreground">Belum ada pengajuan.</p>
        ) : (
          data.data?.requests.map((r) => (
            <div
              key={r.id}
              className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-card p-3 text-sm"
            >
              <span className="font-bold">
                {byId[r.user_id]?.full_name}{" "}
                <span className="font-mono text-xs">{byId[r.user_id]?.member_id}</span>
              </span>
              <Button size="sm" onClick={() => setBlocked(r.user_id, false)}>
                Pulihkan
              </Button>
            </div>
          ))
        )}
      </section>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-primary text-primary-foreground">
            <tr>
              {["ID", "Nama", "Peran", "Status", "Aksi"].map((h) => (
                <th key={h} className="p-3 text-left font-extrabold uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="p-3 font-mono text-xs">{p.member_id}</td>
                <td className="p-3 font-bold">
                  {p.full_name}
                  <span className="block text-xs text-muted-foreground">{p.username}</span>
                </td>
                <td className="p-3 font-semibold">{ROLE_LABEL[p.role]}</td>
                <td className="p-3 font-bold">{p.blocked ? "Diblokir" : "Aktif"}</td>
                <td className="p-3">
                  {p.role === "admin" ? (
                    <span className="text-xs font-bold">Dilindungi</span>
                  ) : (
                    <Button
                      size="sm"
                      variant={p.blocked ? "default" : "destructive"}
                      onClick={() => setBlocked(p.id, !p.blocked)}
                    >
                      {p.blocked ? "Buka Blokir" : "Blokir"}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-2xl bg-card p-4 shadow-card">
        <h2 className="font-extrabold uppercase">Moderasi Berita</h2>
        {(data.data?.news ?? []).map((n) => (
          <div
            key={n.id}
            className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm"
          >
            <span className="font-semibold">{n.caption.slice(0, 60)}</span>
            <Button size="sm" variant="ghost" onClick={() => deleteNews(n.id)}>
              Hapus
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
