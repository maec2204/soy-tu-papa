# Soy tu papá

La cuenta de los partidos de ping pong de la oficina: partidos 1 contra 1 y 2 contra 2, marcador
confirmado por los dos lados, tabla por puntos, rachas y quién es papá de quién.

## Reglas

- Un partido es un juego con un marcador. Solo cuenta cuando lo confirma el equipo contrario al que
  lo cargó. Si responden "No es correcto", el marcador se borra y se vuelve a cargar.
- La tabla se ordena por puntos (Elo, K = 32, todos arrancan en 1000). Aparece quien tenga al menos
  un partido confirmado.
- Papá: 5 o más partidos 1 contra 1 entre dos jugadores y 3 o más victorias de ventaja.
- El 2 contra 2 mueve los puntos de los cuatro y no cuenta para la paternidad.
- Hay una sola mesa. Los partidos aceptados hacen cola en orden de llegada y solo el que está en
  la mesa puede cargar marcador. Sus jugadores pueden cancelarlo; pasados 20 minutos sin
  marcador, cualquiera que espere en la cola puede liberar la mesa y ese partido pasa al final.

Las reglas viven en `supabase/migrations/`. Las tablas son de solo lectura para los
usuarios; todo cambio pasa por las funciones de ese archivo.

## Modo demo (sin Supabase ni cuentas)

`npm run dev:mock` abre la app con jugadores y partidos de ejemplo. Un Postgres en memoria ejecuta
la misma migración, así que las reglas son las reales. El selector de arriba cambia de jugador para
ver los dos lados de un partido. Los datos se reinician al reiniciar el servidor.

## Entrada

Cada jugador entra con su correo y una clave que crea la primera vez. Solo puede crear cuenta un
correo que esté en la tabla `allowed_emails`. La lista vive en la base, no en el repositorio.

## Puesta en marcha

1. Crear un proyecto gratuito en [Supabase](https://supabase.com).
2. En el SQL Editor, ejecutar en orden cada archivo de `supabase/migrations/`.
3. Cargar la lista de jugadores, en minúsculas:
   `insert into public.allowed_emails values ('ana@empresa.com'), ('luis@empresa.com');`
4. En Authentication → Providers → Email: dejar Email activo y apagar "Confirm email" (no se envían
   correos). Dejar apagados el acceso anónimo, por teléfono y los demás proveedores.
5. Copiar `.env.example` a `.env.local` y llenar la URL y la clave pública del proyecto.
6. `npm run dev`.

Si alguien olvida su clave o registró el correo de otro, se le pone una clave temporal desde el
SQL Editor:
`update auth.users set encrypted_password = extensions.crypt('clave-temporal', extensions.gen_salt('bf')) where email = 'ana@empresa.com';`

## Límites del plan gratuito

- Supabase pausa el proyecto tras 1 semana sin actividad; se reactiva a mano desde su panel.
- Los avisos de reto aparecen con la web abierta. No hay avisos al teléfono con la web cerrada.
