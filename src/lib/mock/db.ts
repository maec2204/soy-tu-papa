// Modo demo (NEXT_PUBLIC_MOCK=1): sin Supabase ni cuentas. Un Postgres en memoria
// ejecuta la migración real, así que las reglas del juego son las mismas de producción.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { PGlite } from "@electric-sql/pglite";

export const MOCK = process.env.NEXT_PUBLIC_MOCK === "1";
export const MOCK_USER_COOKIE = "mock_user";

const NAMES = [
  "Ana Rojas",
  "Luis Méndez",
  "Carla Pinto",
  "Diego Luna",
  "Sofía Marín",
  "Valentina Ríos",
  "Pedro Salas",
];
const uuid = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
const [ANA, LUIS, CARLA, DIEGO, SOFIA, VALENTINA] = NAMES.map((_, i) => uuid(i + 1));

async function start(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('mock.uid', true), '')::uuid $$;
    create publication supabase_realtime;
  `);
  const migrations = join(process.cwd(), "supabase/migrations");
  for (const file of readdirSync(migrations).sort()) {
    await db.exec(readFileSync(join(migrations, file), "utf8"));
  }

  for (const [i, name] of NAMES.entries()) {
    await db.query(`insert into public.allowed_emails values ($1)`, [
      `jugador${i + 1}@example.com`,
    ]);
    await db.query(
      `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`,
      [uuid(i + 1), `jugador${i + 1}@example.com`, { name }],
    );
  }

  const as = (id: string) => db.query(`select set_config('mock.uid', $1, false)`, [id]);
  const create = async (creator: string, rival: string) => {
    await as(creator);
    const { rows } = await db.query<{ id: string }>(
      `select public.create_match('1v1', array[$1]::uuid[]) as id`,
      [rival],
    );
    return rows[0].id;
  };
  const upTo = async (
    step: "accept" | "report" | "confirm",
    creator: string,
    rival: string,
    a = 0,
    b = 0,
  ) => {
    const id = await create(creator, rival);
    await as(rival);
    await db.query(`select public.accept_match($1)`, [id]);
    if (step === "accept") return;
    await as(creator);
    await db.query(`select public.report_score($1, $2, $3)`, [id, a, b]);
    if (step === "report") return;
    await as(rival);
    await db.query(`select public.confirm_score($1)`, [id]);
  };
  const play = (creator: string, rival: string, a: number, b: number) =>
    upTo("confirm", creator, rival, a, b);

  // Ana le lleva 5–2 a Luis: es su papá. Carla domina a Diego 5–0.
  await play(ANA, LUIS, 11, 7);
  await play(ANA, LUIS, 11, 9);
  await play(LUIS, ANA, 11, 8);
  await play(ANA, LUIS, 11, 4);
  await play(LUIS, ANA, 12, 10);
  for (const score of [5, 3, 9, 6, 8]) await play(CARLA, DIEGO, 11, score);
  await play(CARLA, ANA, 11, 9);
  await play(SOFIA, LUIS, 11, 6);
  await play(SOFIA, DIEGO, 11, 2);
  await play(VALENTINA, SOFIA, 11, 9);
  await play(ANA, VALENTINA, 11, 5);
  await play(ANA, LUIS, 11, 3);
  await play(ANA, LUIS, 11, 6);

  // Partidos abiertos para Ana: un reto por aceptar, un marcador por confirmar y uno en juego.
  await create(DIEGO, ANA);
  await upTo("report", SOFIA, ANA, 11, 8);
  await upTo("accept", ANA, VALENTINA);
  // Con Ana y Valentina en la mesa, Carla y Luis quedan en cola.
  await upTo("accept", CARLA, LUIS);

  await as("");
  return db;
}

const globalForMock = globalThis as unknown as { mockDb?: Promise<PGlite> };

function getDb(): Promise<PGlite> {
  return (globalForMock.mockDb ??= start());
}

export async function mockUserId(): Promise<string> {
  return (await cookies()).get(MOCK_USER_COOKIE)?.value ?? ANA;
}

export async function mockQuery<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const db = await getDb();
  return (await db.query<T>(sql, params)).rows;
}

/** Llama a una función de la migración con la identidad del jugador elegido en la demo. */
export async function mockRpc(fn: string, args: Record<string, unknown>) {
  const db = await getDb();
  const uid = await mockUserId();
  const keys = Object.keys(args);
  const call = keys.map((key, i) => `${key} => $${i + 1}`).join(", ");
  try {
    const data = await db.transaction(async (tx) => {
      await tx.query(`select set_config('mock.uid', $1, true)`, [uid]);
      const { rows } = await tx.query<{ result: unknown }>(
        `select public.${fn}(${call}) as result`,
        keys.map((key) => args[key]),
      );
      return rows[0].result;
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
