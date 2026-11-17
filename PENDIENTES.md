# Pendientes y relevo

Estado al 2026-11-17. Lo retoma Pio (`cpiocova`). Las reglas del juego están en `README.md`.

## Cómo está armado

- Next.js 16 (App Router) + TypeScript + Tailwind v4. Supabase gratis: base de datos, cuentas y
  avisos en vivo. Todo el stack debe seguir siendo gratuito.
- Las reglas viven en la base, no en la pantalla: las tablas son de solo lectura para los usuarios
  (RLS) y todo cambio pasa por funciones `security definer` de `supabase/migrations/`.
  Una regla nueva va en una migración nueva (`0003_...sql`), nunca editando las ya ejecutadas.
- `src/lib/data.ts` lee, `src/lib/matches.ts` ejecuta acciones. Cada uno tiene una rama para el
  modo demo.
- Modo demo: `npm run dev:mock`. Un Postgres en memoria (PGlite) ejecuta las mismas migraciones.
  Sirve para ver pantallas y probar reglas sin tocar Supabase. No se pueden correr `dev` y
  `dev:mock` a la vez en la misma carpeta.
- La base real ya tiene ejecutadas `0001_init.sql` y `0002_queue.sql`.

## Para arrancar en una máquina nueva

1. `npm install`.
2. Pedir a Moisés la URL y la clave pública (publishable) del proyecto de Supabase y ponerlas en
   `.env.local` (ver `.env.example`). La clave secreta no se usa y no debe llevar el prefijo
   `NEXT_PUBLIC_`.
3. Pedir a Moisés que agregue tu correo, en minúsculas, a la tabla `allowed_emails`.
4. `npm run dev`, entrar por "Es mi primera vez" y crear la clave.

## Falta verificar contra Supabase real

Todo esto funciona en el modo demo o en pruebas de base en memoria, pero no se ha visto funcionar
contra el proyecto real. Hacen falta dos cuentas en dos navegadores.

- [ ] Avisos en vivo: al retar, el reto aparece en la otra ventana sin recargar
      (`src/components/LiveRefresh.tsx`, Realtime sobre `matches`).
- [ ] Historial del perfil y de Partidos: la consulta de `getRecentMatches` en `src/lib/data.ts`
      usa un embed con alias (`mine:match_players!inner`) que nunca corrió contra PostgREST.
- [ ] Flujo completo: retar, aceptar, cargar marcador, confirmar, disputar ("No es correcto").
- [ ] Cola: con un partido en la mesa, el segundo queda "En cola" y no puede cargar marcador;
      "Cancelar partido" y "Liberar la mesa" pasados 20 minutos.
- [ ] Comando de clave temporal del `README.md` (`extensions.crypt`): escrito de memoria.
- [ ] Un correo fuera de `allowed_emails` no puede crear cuenta.

## Falta hacer

- [ ] Despliegue en Vercel (plan Hobby). Solo cuando Moisés lo indique. Variables:
      `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Nota: los términos de
      Hobby dicen "uso personal o no comercial"; Cloudflare Pages es la alternativa gratuita.
- [ ] El premio del primero de la tabla sigue sin definir.

## Ideas de Moisés, sin diseñar

Son ideas, no requisitos. Antes de construir hay que acordar las reglas con Moisés.

- Organización de torneos.
- Bote del mes: llevar la cuenta de cuánto hay, cuánto se lleva el ganador y quiénes deben.

## Decisiones tomadas (no reabrir sin hablar con Moisés)

- Un partido es un juego con un marcador. Solo cuenta cuando lo confirma el equipo contrario.
- Puntos Elo, K = 32, inicio en 1000. En 2 contra 2 se usa el promedio del equipo.
- Papá: 5 o más partidos 1 contra 1 y 3 o más victorias de ventaja. El 2 contra 2 no cuenta.
- Entrada con correo y clave propia; la lista de correos vive en `allowed_emails`, no en el código.
  Se descartó Google y se descartó entrar solo con el correo (permitía suplantar a otro).
- Una sola mesa con cola. La mesa se libera al cargar el marcador. Sus jugadores pueden cancelar;
  pasados 20 minutos sin marcador, cualquiera que espere en la cola puede liberarla.

## Convenciones

- Español neutro en textos y comentarios. Commits convencionales, sin atribución de IA.
- No ejecutar build para verificar; usar `npx tsc --noEmit`, `npx eslint src` y el modo demo.
- En desarrollo, las cookies de `localhost` se comparten entre proyectos y pueden dar un 431; por
  eso los scripts `dev` suben el límite de cabeceras.
- Nada de secretos ni correos reales en el repositorio: es público.
