"use client";

import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { releaseTable } from "@/lib/matches";

/** Para quien espera en la cola: cuenta lo que falta y, llegado el momento, deja liberar la mesa. */
export function ReleaseTable({ availableAt }: { availableAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 15_000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) return null;
  const minutes = Math.ceil((new Date(availableAt).getTime() - now) / 60_000);

  if (minutes > 0) {
    return (
      <p className="mt-4 text-linea/80">
        Si no cargan el marcador, en {minutes} {minutes === 1 ? "minuto" : "minutos"} vas a
        poder liberar la mesa.
      </p>
    );
  }

  return (
    <form action={releaseTable} className="mt-4">
      <p className="mb-3 text-linea/80">
        Llevan más de 20 minutos sin cargar el marcador. Si liberas la mesa, ese partido pasa
        al final de la cola.
      </p>
      <SubmitButton className="w-full rounded-full bg-pelota px-6 py-4 text-lg font-semibold text-mesa-honda">
        Liberar la mesa
      </SubmitButton>
    </form>
  );
}
