import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/_authenticated/dashboard/guru")({
  component: DataGuru,
});

function DataGuru() {
  const { isApproved } = useMe();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["profiles", "guru"],
    enabled: isApproved,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "guru")
        .eq("status", "approved")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter(
      (item) =>
        !term ||
        item.full_name.toLowerCase().includes(term) ||
        (item.subject ?? "").toLowerCase().includes(term),
    );
  }, [data, search]);

  if (!isApproved) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Data guru tersedia setelah akun Anda disetujui admin.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">Data Guru</h1>
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama / mata pelajaran"
          className="w-60"
          maxLength={60}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase">Nama Lengkap</TableHead>
              <TableHead className="uppercase">Username</TableHead>
              <TableHead className="uppercase">Mata Pelajaran</TableHead>
              <TableHead className="uppercase">NIP</TableHead>
              <TableHead className="uppercase">Telepon</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center font-bold uppercase">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center font-bold uppercase">
                  Belum ada data guru.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold">{item.full_name}</TableCell>
                  <TableCell className="font-semibold">{item.username}</TableCell>
                  <TableCell className="font-bold">{item.subject ?? "-"}</TableCell>
                  <TableCell className="font-semibold">{item.id_number ?? "-"}</TableCell>
                  <TableCell className="font-semibold">{item.phone ?? "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
