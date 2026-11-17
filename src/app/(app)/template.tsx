"use client";

import { usePathname } from "next/navigation";

/** Cada vista entra con un movimiento corto. Se vuelve a montar solo al cambiar de vista. */
export default function Template({ children }: { children: React.ReactNode }) {
  // En /nuevo el botón "Empezar" va fijo abajo y un transform lo descolocaría.
  const fixedInside = usePathname() === "/nuevo";
  return <div className={fixedInside ? "aparece" : "entra"}>{children}</div>;
}
