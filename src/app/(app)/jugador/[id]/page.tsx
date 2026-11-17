import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { MatchRow } from "@/components/MatchRow";
import { SubmitButton } from "@/components/SubmitButton";
import { getFatherhoods, getMyId, getPlayers, getRecentMatches } from "@/lib/data";
import { signOut } from "@/lib/matches";
import type { Player } from "@/lib/types";

function Family({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { player: Player; record: string }[];
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-3xl font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-1 text-linea/70">{empty}</p>
      ) : (
        <ul className="mt-1 divide-y divide-linea/15">
          {rows.map(({ player, record }) => (
            <li key={player.id}>
              <Link href={`/jugador/${player.id}`} className="flex items-center gap-3 py-3">
                <Avatar player={player} size={32} />
                <span className="flex-1 truncate text-lg font-semibold">{player.name}</span>
                <span className="marcador text-2xl">{record}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function PlayerPage({ params }: PageProps<"/jugador/[id]">) {
  const { id } = await params;
  const [me, players] = await Promise.all([getMyId(), getPlayers()]);
  const player = players.get(id);
  if (!player) notFound();

  const [fatherhoods, matches] = await Promise.all([
    getFatherhoods(id),
    getRecentMatches(id),
  ]);

  const row = (otherId: string, record: string) => ({
    player: players.get(otherId)!,
    record,
  });
  const children = fatherhoods
    .filter((f) => f.father_id === id)
    .map((f) => row(f.child_id, `${f.wins}–${f.losses}`));
  const fathers = fatherhoods
    .filter((f) => f.child_id === id)
    .map((f) => row(f.father_id, `${f.losses}–${f.wins}`));

  const own = id === me;
  const stats = [
    { label: "Ganados", value: player.wins },
    { label: "Perdidos", value: player.losses },
    { label: "Racha", value: player.current_streak },
    { label: "Mejor racha", value: player.best_streak },
  ];

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar player={player} size={64} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-4xl font-bold">{player.name}</h1>
          <p className="text-linea/80">
            <span className="marcador text-2xl text-pelota">{player.rating}</span> puntos
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-4 border-y border-linea/15 py-4 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col-reverse">
            <dt className="text-sm text-linea/70">{stat.label}</dt>
            <dd className="marcador text-4xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <Family
        title={own ? "Tus hijos" : "Sus hijos"}
        empty={own ? "Todavía no eres papá de nadie." : "Todavía no es papá de nadie."}
        rows={children}
      />
      <Family
        title={own ? "Tus papás" : "Sus papás"}
        empty={own ? "Nadie es tu papá. Por ahora." : "Nadie es su papá. Por ahora."}
        rows={fathers}
      />

      <section className="mt-8">
        <h2 className="font-display text-3xl font-semibold">Últimos partidos</h2>
        {matches.length === 0 ? (
          <p className="mt-1 text-linea/70">Sin partidos confirmados.</p>
        ) : (
          <ul className="mt-1 divide-y divide-linea/15">
            {matches.map((match) => (
              <li key={match.id}>
                <MatchRow match={match} playerId={id} players={players} own={own} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {own && (
        <form action={signOut} className="mt-10">
          <SubmitButton className="w-full rounded-full border-2 border-linea/50 px-6 py-3 font-semibold">
            Salir
          </SubmitButton>
        </form>
      )}
    </>
  );
}
