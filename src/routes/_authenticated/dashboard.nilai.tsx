import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, Pencil, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks/useMe";
import { supabase } from "@/integrations/supabase/client";
import { SUBJECTS } from "@/lib/school";

export const Route = createFileRoute("/_authenticated/dashboard/nilai")({
  component: DaftarNilai,
});

type GradeRow = {
  id: string;
  student_id: string;
  subject: string;
  score: number;
  note: string | null;
  profiles: {
    full_name: string;
    class_name: string | null;
    username: string;
  } | null;
};

type StudentOption = {
  id: string;
  full_name: string;
  class_name: string | null;
  username: string;
};

function DaftarNilai() {
  const { profile, isAdmin, isGuru, isApproved } = useMe();
  const queryClient = useQueryClient();
  const canSeeAll = isAdmin || isGuru;

  const grades = useQuery({
    queryKey: ["grades", profile?.id, canSeeAll],
    enabled: Boolean(profile?.id) && isApproved,
    queryFn: async () => {
      let query = supabase
        .from("grades")
        .select(
          "id, student_id, subject, score, note, profiles!grades_student_id_fkey(full_name, class_name, username)",
        )
        .order("subject", { ascending: true });
      if (!canSeeAll && profile?.id) {
        query = query.eq("student_id", profile.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as GradeRow[];
    },
  });

  const students = useQuery({
    queryKey: ["grade-students"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, class_name, username")
        .eq("role", "siswa")
        .eq("status", "approved")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StudentOption[];
    },
  });

  // Form (admin)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [score, setScore] = useState("");
  const [note, setNote] = useState("");

  function resetForm() {
    setEditingId(null);
    setStudentId("");
    setSubject(SUBJECTS[0]);
    setScore("");
    setNote("");
  }

  function startEdit(grade: GradeRow) {
    setEditingId(grade.id);
    setStudentId(grade.student_id);
    setSubject(grade.subject);
    setScore(String(grade.score));
    setNote(grade.note ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const saveGrade = useMutation({
    mutationFn: async () => {
      const numericScore = Number(score);
      if (!studentId) throw new Error("Pilih siswa terlebih dahulu.");
      if (score === "" || Number.isNaN(numericScore) || numericScore < 0 || numericScore > 100) {
        throw new Error("Nilai harus berupa angka 0 sampai 100.");
      }

      if (editingId) {
        const { error } = await supabase
          .from("grades")
          .update({
            student_id: studentId,
            subject,
            score: numericScore,
            note: note.trim() || null,
          })
          .eq("id", editingId);
        if (error) throw new Error("Nilai gagal diperbarui.");
      } else {
        const { error } = await supabase.from("grades").insert({
          student_id: studentId,
          subject,
          score: numericScore,
          note: note.trim() || null,
        });
        if (error) throw new Error("Nilai gagal disimpan.");
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Nilai diperbarui." : "Nilai disimpan.");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteGrade = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grades").delete().eq("id", id);
      if (error) throw new Error("Nilai gagal dihapus.");
    },
    onSuccess: () => {
      toast.success("Nilai dihapus.");
      queryClient.invalidateQueries({ queryKey: ["grades"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isApproved) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Daftar nilai terbuka setelah akun Anda disetujui admin.
      </p>
    );
  }

  const rows = grades.data ?? [];
  const average =
    rows.length > 0
      ? (rows.reduce((sum, row) => sum + Number(row.score), 0) / rows.length).toFixed(2)
      : null;

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-display text-2xl uppercase text-primary sm:text-3xl">
        <Award className="size-7" strokeWidth={2.4} />
        Daftar Nilai
      </h1>

      {/* Form admin */}
      {isAdmin ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-display text-xl uppercase text-primary">
            {editingId ? "Ubah Nilai" : "Input Nilai Siswa"}
          </h2>

          {students.data && students.data.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-secondary/50 p-4 text-sm font-bold text-muted-foreground">
              Belum ada siswa terdaftar yang disetujui. Nilai bisa diinput setelah ada siswa
              terdaftar.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="grade-student" className="uppercase">
                Siswa
              </Label>
              <select
                id="grade-student"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold"
              >
                <option value="">Pilih siswa...</option>
                {(students.data ?? []).map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                    {student.class_name ? ` — ${student.class_name}` : ""} ({student.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grade-subject" className="uppercase">
                Mata Pelajaran
              </Label>
              <select
                id="grade-subject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold"
              >
                {SUBJECTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="grade-score" className="uppercase">
                Nilai (0 — 100)
              </Label>
              <Input
                id="grade-score"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                placeholder="Contoh: 85"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade-note" className="uppercase">
                Catatan (opsional)
              </Label>
              <Input
                id="grade-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Contoh: Ulangan harian bab 1"
                maxLength={120}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="gold"
              disabled={saveGrade.isPending}
              onClick={() => saveGrade.mutate()}
            >
              <Save />
              {saveGrade.isPending
                ? "Menyimpan..."
                : editingId
                  ? "Simpan Perubahan"
                  : "Simpan Nilai"}
            </Button>
            {editingId ? (
              <Button variant="outline" onClick={resetForm}>
                <X />
                Batal
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Daftar nilai */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-display text-xl uppercase text-primary">
            {canSeeAll ? "Nilai Seluruh Siswa" : "Nilai Saya"}
          </h2>
          {average ? (
            <p className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-primary">
              Rata-rata: {average}
            </p>
          ) : null}
        </div>

        {rows.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">
                  {canSeeAll ? <th className="py-2 pr-3">Siswa</th> : null}
                  <th className="py-2 pr-3">Mata Pelajaran</th>
                  <th className="py-2 pr-3">Nilai</th>
                  <th className="py-2 pr-3">Catatan</th>
                  {isAdmin ? <th className="py-2">Aksi</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    {canSeeAll ? (
                      <td className="py-2.5 pr-3 font-bold">
                        {row.profiles?.full_name ?? "Siswa"}
                        {row.profiles?.class_name ? (
                          <span className="block text-xs font-semibold text-muted-foreground">
                            {row.profiles.class_name}
                          </span>
                        ) : null}
                      </td>
                    ) : null}
                    <td className="py-2.5 pr-3 font-semibold">{row.subject}</td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={
                          Number(row.score) >= 75
                            ? "rounded-lg bg-success/15 px-2 py-1 font-extrabold text-success"
                            : "rounded-lg bg-destructive/15 px-2 py-1 font-extrabold text-destructive"
                        }
                      >
                        {Number(row.score)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-muted-foreground">
                      {row.note ?? "—"}
                    </td>
                    {isAdmin ? (
                      <td className="py-2.5">
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="Ubah nilai"
                            onClick={() => startEdit(row)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="Hapus nilai"
                            disabled={deleteGrade.isPending}
                            onClick={() => deleteGrade.mutate(row.id)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-border bg-secondary/50 p-6 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {canSeeAll
              ? "Belum ada nilai yang diinput."
              : "Belum ada nilai untuk Anda. Hubungi admin sekolah."}
          </p>
        )}
      </section>
    </div>
  );
}
