import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  role: "admin" | "guru" | "siswa";
  status: "pending" | "approved" | "rejected";
  class_name: string | null;
  subject: string | null;
  id_number: string | null;
  gender: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  created_at: string;
};

export function useSessionUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserId(data.user?.id ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { userId, ready };
}

export function useMe() {
  const { userId, ready } = useSessionUser();

  const query = useQuery({
    queryKey: ["me", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId as string)
        .maybeSingle();
      if (error) throw error;
      return (data as Profile | null) ?? null;
    },
  });

  const profile = query.data ?? null;

  return {
    userId,
    ready,
    profile,
    loading: !ready || (Boolean(userId) && query.isLoading),
    isAdmin: profile?.role === "admin",
    isGuru: profile?.role === "guru",
    isApproved: profile?.status === "approved",
    refetch: query.refetch,
  };
}
