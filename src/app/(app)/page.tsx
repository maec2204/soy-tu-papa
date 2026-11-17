import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { EmptyState } from "@/components/EmptyState";
import { OpenMatches } from "@/components/OpenMatches";
import { getMyId, getPlayers } from "@/lib/data";

const count = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default async function RankingPage() {
  const [me, players] = await Promise.all([getMyId(), getPlayers()]);
  // Solo entra a la tabla quien ya tiene un partido confirmado.
  const ranking = [...players.values()].filter((p) => p.wins + p.losses > 0);
  const last = ranking.length - 1;

  return (
    <>
      <OpenMatches />
      <h1 className="font-display text-5xl font-bold">La tabla</h1>

      {ranking.length === 0 ? (
        <EmptyState
          title="La tabla está vacía"
          action={{ href: "/nuevo", label: "Retar a alguien" }}
        >
          Aquí aparece quien tenga un partido confirmado. Juega el primero y quédate con el
          puesto 1.
        </EmptyState>
      ) : (
        <ol className="mt-4 divide-y divide-linea/15">
          {ranking.map((player, index) => (
            <li
              key={player.id}
              className="escalon"
              style={{ "--i": index } as React.CSSProperties}
            >
              <Link
                href={`/jugador/${player.id}`}
                className={`flex items-center gap-3 py-3 ${
                  player.id === me ? "-mx-4 bg-mesa-clara px-4" : ""
                }`}
              >
                <span
                  className={`marcador w-9 text-4xl ${index === 0 ? "text-pelota" : ""}`}
                >
                  {index + 1}
                </span>
                <Avatar player={player} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-semibold">
                    {player.name}
                  </span>
                  <span className="block text-sm text-linea/70">
                    {count(player.wins, "ganado")}, {count(player.losses, "perdido")}
                    {player.current_streak >= 2 && `, ${player.current_streak} seguidos`}
                  </span>
                  {index === 0 && (
                    <span className="block text-sm font-semibold text-pelota">
                      Se lleva el premio
                    </span>
                  )}
                  {index === last && last > 0 && (
                    <span className="block text-sm font-semibold text-goma">
                      La burla de la oficina
                    </span>
                  )}
                </span>
                <span className="marcador text-3xl">{player.rating}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
