const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** Podio: la tabla. */
export const IconTabla = () => (
  <svg {...base}>
    <path d="M9 21V9h6v12M3 21v-7h6M15 21v-9h6v9M2 21h20" />
  </svg>
);

/** Raqueta y pelota: los partidos. */
export const IconPartidos = () => (
  <svg {...base}>
    <circle cx="9.5" cy="9.5" r="6.5" fill="currentColor" />
    <path d="M14 14l6 6" strokeWidth={3.5} />
    <circle cx="20" cy="4.5" r="2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconPerfil = () => (
  <svg {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </svg>
);

export const IconVolver = () => (
  <svg {...base}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const IconMas = () => (
  <svg {...base} strokeWidth={2.5}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconIr = () => (
  <svg {...base} width={18} height={18}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
