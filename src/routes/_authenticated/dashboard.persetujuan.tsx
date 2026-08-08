import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMe, type Profile } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { decideRegistration, deleteAccount } from "@/lib/admin.functions";
import { ROLE_LABEL, STATUS_LABEL } from "@/lib/school";

export const Route = createFileRoute("/_authenticated/dashboard/persetujuan")({
  component: Persetujuan,
});

function Persetujuan() {
  const { isAdmin } = useMe();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["profiles", "all"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const decide = useMutation({
    mutationFn: (input: { userId: string; approve: boolean; role: "guru" | "siswa" }) =>
      decideRegistration({ data: input }),
    onSuccess: (_result, input) => {
      toast.success(input.approve ? "Akun disetujui." : "Akun ditolak.");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Tindakan gagal dijalankan."),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => deleteAccount({ data: { userId } }),
    onSuccess: () => {
      toast.success("Akun dihapus.");
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: () => toast.error("Akun gagal dihapus."),
  });

  if (!isAdmin) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Halaman ini hanya untuk admin sekolah.
      </p>
    );
  }

  const pending = (data ?? []).filter((item) => item.status === "pending");
  const others = (data ?? []).filter((item) => item.status !== "pending");
  const busy = decide.isPending || remove.isPending;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">
          Menunggu Persetujuan
        </h1>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase">Nama</TableHead>
                <TableHead className="uppercase">Username</TableHead>
                <TableHead className="uppercase">Daftar Sebagai</TableHead>
                <TableHead className="uppercase">Kelas / Mapel</TableHead>
                <TableHead className="uppercase">Tindakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center font-bold uppercase">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : pending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center font-bold uppercase">
                    Tidak ada pendaftaran baru.
                  </TableCell>
                </TableRow>
              ) : (
                pending.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold">{item.full_name}</TableCell>
                    <TableCell className="font-semibold">{item.username}</TableCell>
                    <TableCell className="font-bold">{ROLE_LABEL[item.role]}</TableCell>
                    <TableCell className="font-semibold">
                      {item.class_name ?? item.subject ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() =>
                            decide.mutate({
                              userId: item.id,
                              approve: true,
                              role: item.role === "guru" ? "guru" : "siswa",
                            })
                          }
                        >
                          <Check />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() =>
                            decide.mutate({
                              userId: item.id,
                              approve: false,
                              role: item.role === "guru" ? "guru" : "siswa",
                            })
                          }
                        >
                          <X />
                          Tolak
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-display text-xl uppercase text-primary">Seluruh Akun</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="uppercase">Nama</TableHead>
                <TableHead className="uppercase">Username</TableHead>
                <TableHead className="uppercase">Peran</TableHead>
                <TableHead className="uppercase">Status</TableHead>
                <TableHead className="uppercase">Kelas / Mapel</TableHead>
                <TableHead className="uppercase">Hapus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {others.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center font-bold uppercase">
                    Belum ada akun lain.
                  </TableCell>
                </TableRow>
              ) : (
                others.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold">{item.full_name}</TableCell>
                    <TableCell className="font-semibold">{item.username}</TableCell>
                    <TableCell className="font-bold">{ROLE_LABEL[item.role]}</TableCell>
                    <TableCell className="font-semibold">{STATUS_LABEL[item.status]}</TableCell>
                    <TableCell className="font-semibold">
                      {item.class_name ?? item.subject ?? "-"}
                    </TableCell>
                    <TableCell>
                      {item.role === "admin" ? (
                        <span className="text-xs font-bold uppercase text-muted-foreground">—</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => remove.mutate(item.id)}
                        >
                          <Trash2 />
                          Hapus
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
