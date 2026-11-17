"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Vuelve a pintar la pantalla cuando cambia cualquier partido: así llega el aviso del reto. */
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    // Modo demo: sin avisos en vivo, se consulta cada 2 segundos.
    if (process.env.NEXT_PUBLIC_MOCK === "1") {
      const timer = setInterval(() => router.refresh(), 2000);
      return () => clearInterval(timer);
    }

    const supabase = createClient();
    const channel = supabase
      .channel("matches")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () =>
        router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
