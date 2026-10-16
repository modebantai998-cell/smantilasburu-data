import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function RecoveryBanner({ memberId, userId }: { memberId: string | null; userId: string }) {
  const queryClient = useQueryClient();
  const request = useQuery({
    queryKey: ["my-recovery", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("recovery_requests")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
  });

  async function ajukan() {
    const { error } = await supabase.from("recovery_requests").insert({ user_id: userId });
    if (error) {
      toast.error("Pengajuan gagal dikirim.");
      return;
    }
    toast.success("Pengajuan berhasil dikirim ke admin!");
    queryClient.invalidateQueries({ queryKey: ["my-recovery", userId] });
  }

  return (
    <div className="mt-5 rounded-2xl border-2 border-destructive bg-card p-6 text-center shadow-card">
      <ShieldAlert className="mx-auto size-12 text-destructive" />
      <h2 className="text-display mt-2 text-xl uppercase text-destructive">Akun Diblokir</h2>
      <p className="mt-2 text-sm font-extrabold">
        Akun anda telah diblokir admin. Silakan klik pengajuan untuk dipulihkan kembali.
      </p>
      {memberId ? (
        <p className="mx-auto mt-3 w-fit rounded bg-secondary px-3 py-1 font-mono text-xs font-bold">
          ID: {memberId}
        </p>
      ) : null}
      {request.data ? (
        <p className="mt-4 text-sm font-extrabold uppercase text-primary">
          Pengajuan sudah terkirim — menunggu admin.
        </p>
      ) : (
        <Button className="mt-4" size="lg" onClick={ajukan}>
          Ajukan Pemulihan Akun
        </Button>
      )}
    </div>
  );
}
