import Link from "next/link";
import type { ReactNode } from "react";

/** Lista vacía: una mesa sin jugadores, qué falta y, si aplica, el botón para resolverlo. */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="escalon mt-6 flex flex-col items-center rounded-3xl border-2 border-dashed border-linea/25 px-6 py-10 text-center">
      <svg width="96" height="68" viewBox="0 0 96 68" fill="none" aria-hidden>
        <rect x="2" y="2" width="92" height="64" rx="10" stroke="var(--color-linea)" strokeWidth="3" />
        <path d="M48 2v64" stroke="var(--color-linea)" strokeWidth="3" strokeDasharray="5 5" opacity=".7" />
        <circle cx="68" cy="24" r="6" fill="var(--color-pelota)" />
      </svg>
      <h2 className="mt-5 font-display text-3xl font-semibold">{title}</h2>
      <p className="mt-1 max-w-[30ch] text-linea/80">{children}</p>
      {action && (
        <Link
          href={action.href}
          className="boton mt-6 rounded-full bg-pelota px-6 py-3 text-lg font-semibold text-mesa-honda"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

/** Sección vacía dentro de una vista que sí tiene contenido. */
export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded-2xl border-2 border-dashed border-linea/20 px-4 py-4 text-linea/70">
      {children}
    </p>
  );
}
