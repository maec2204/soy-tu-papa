import { MatchRow } from "@/components/MatchRow";
import { OpenMatch } from "@/components/OpenMatches";
import { getMyId, getMyOpenMatches, getPlayers, getRecentMatches } from "@/lib/data";
import { waitsFor, type Match } from "@/lib/types";

export default async function MatchesPage() {
  const me = await getMyId();
  const [players, open, played] = await Promise.all([
    getPlayers(),
    getMyOpenMatches(),
    getRecentMatches(me),
  ]);
  const mine = open.filter((match) => waitsFor(match, me));
  const theirs = open.filter((match) => !waitsFor(match, me));

  const openSection = (title: string, matches: Match[]) =>
    matches.length > 0 && (
      <section className="mt-6">
        <h2 className="font-display text-3xl font-semibold">{title}</h2>
        <ul className="mt-2 space-y-2">
          {matches.map((match, index) => (
            <li key={match.id} className="escalon" style={{ "--i": index } as React.CSSProperties}>
              <OpenMatch match={match} me={me} players={players} />
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <>
      <h1 className="font-display text-5xl font-bold">Partidos</h1>

      {open.length === 0 && played.length === 0 && (
        <p className="mt-4 max-w-[30ch] text-lg text-linea/80">
          Todavía no tienes partidos. Toca Retar para empezar el primero.
        </p>
      )}

      {openSection("Te toca", mine)}
      {openSection("Esperando al otro lado", theirs)}

      {played.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-3xl font-semibold">Jugados</h2>
          <ul className="mt-1 divide-y divide-linea/15">
            {played.map((match) => (
              <li key={match.id}>
                <MatchRow match={match} playerId={me} players={players} own />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
