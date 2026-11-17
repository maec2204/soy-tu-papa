"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Botón de formulario que se atenúa mientras la acción viaja, para que el toque se note. */
export function SubmitButton({
  className = "",
  disabled = false,
  children,
}: {
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={disabled || pending}
      aria-busy={pending}
      className={`${className} ${pending ? "enviando" : ""}`}
    >
      {children}
    </button>
  );
}
