"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconVolver } from "@/components/Icons";

function detailTitle(pathname: string, me: string): string | null {
  if (pathname === "/nuevo") return "Nuevo partido";
  if (pathname.startsWith("/partido/")) return "Partido";
  if (pathname.startsWith("/jugador/") && pathname !== `/jugador/${me}`) return "Jugador";
  return null;
}

/** Arriba: el nombre de la app en las pestañas; flecha de volver y título en las vistas de detalle. */
export function TopBar({ me }: { me: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const title = detailTitle(pathname, me);

  if (!title) {
    return (
      <header className="py-4">
        <Link href="/" className="font-display text-2xl font-bold">
          Soy tu papá
        </Link>
      </header>
    );
  }

  return (
    <header className="grid grid-cols-[2.75rem_1fr_2.75rem] items-center py-3">
      <button
        type="button"
        aria-label="Volver"
        onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
        className="flex size-11 items-center justify-center rounded-full bg-mesa-clara"
      >
        <IconVolver />
      </button>
      <p className="text-center font-display text-xl font-semibold">{title}</p>
    </header>
  );
}
