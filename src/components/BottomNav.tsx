"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMas, IconPartidos, IconPerfil, IconTabla } from "@/components/Icons";

/** Abajo: las tres vistas principales y el botón para retar. `pending` = lo que espera por mí. */
export function BottomNav({ me, pending }: { me: string; pending: number }) {
  const pathname = usePathname();
  // Al armar un partido la barra cede el lugar al botón "Empezar".
  if (pathname === "/nuevo") return null;

  const profile = `/jugador/${me}`;
  const tabs = [
    { href: "/", label: "Tabla", icon: <IconTabla /> },
    { href: "/partidos", label: "Partidos", icon: <IconPartidos /> },
    { href: profile, label: "Perfil", icon: <IconPerfil /> },
  ];
  const active =
    pathname === profile ? 2 : pathname.startsWith("/partido") ? 1 : 0;

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-mesa from-55% px-4 pt-8 pb-4"
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="relative grid flex-1 grid-cols-3 rounded-full border border-linea/15 bg-mesa-honda p-1">
          <span
            aria-hidden
            className="indicador absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-mesa-clara"
            style={{ transform: `translateX(${active * 100}%)` }}
          />
          {tabs.map((tab, index) => (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={index === active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-0.5 rounded-full py-1.5 text-xs font-semibold transition-colors ${
                index === active ? "text-linea" : "text-linea/60"
              }`}
            >
              <span className="relative">
                {tab.icon}
                {tab.href === "/partidos" && pending > 0 && (
                  <span className="absolute -top-1.5 -right-3 flex min-w-5 items-center justify-center rounded-full bg-goma px-1 text-xs leading-5 font-bold text-mesa-honda">
                    {pending}
                    <span className="sr-only"> esperan por ti</span>
                  </span>
                )}
              </span>
              {tab.label}
            </Link>
          ))}
        </div>
        <Link
          href="/nuevo"
          className="boton flex h-14 items-center gap-1.5 rounded-full bg-pelota pr-5 pl-4 text-lg font-semibold text-mesa-honda"
        >
          <IconMas />
          Retar
        </Link>
      </div>
    </nav>
  );
}
