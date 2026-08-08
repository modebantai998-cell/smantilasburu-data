import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CLASSES } from "@/lib/school";

export const Route = createFileRoute("/_authenticated/dashboard/siswa")({
  component: DataSiswa,
});

function DataSiswa() {
  const { isApproved } = useMe();
  const [search, setSearch] = useState("");
  const [kelas, setKelas] = useState("semua");

  const { data, isLoading } = useQuery({
    queryKey: ["profiles", "siswa"],
    enabled: isApproved,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "siswa")
        .eq("status", "approved")
        .order("class_name", { ascending: true })
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Profile[];
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((item) => {
      const matchClass = kelas === "semua" || item.class_name === kelas;
      const matchTerm =
        !term ||
        item.full_name.toLowerCase().includes(term) ||
        item.username.toLowerCase().includes(term) ||
        (item.id_number ?? "").toLowerCase().includes(term);
      return matchClass && matchTerm;
    });
  }, [data, kelas, search]);

  if (!isApproved) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Data siswa tersedia setelah akun Anda disetujui admin.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-display text-2xl uppercase text-primary sm:text-3xl">Data Siswa</h1>
        <div className="flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama / NISN"
            className="w-52"
            maxLength={60}
          />
          <Select value={kelas} onValueChange={setKelas}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kelas</SelectItem>
              {CLASSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase">Nama Lengkap</TableHead>
              <TableHead className="uppercase">Username</TableHead>
              <TableHead className="uppercase">Kelas</TableHead>
              <TableHead className="uppercase">NISN</TableHead>
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
                  Belum ada data siswa.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold">{item.full_name}</TableCell>
                  <TableCell className="font-semibold">{item.username}</TableCell>
                  <TableCell className="font-bold">{item.class_name ?? "-"}</TableCell>
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
