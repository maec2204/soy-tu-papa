import Link from "next/link";
import { IconIr } from "@/components/Icons";
import { SubmitButton } from "@/components/SubmitButton";
import { getMyId, getMyOpenMatches, getPlayers } from "@/lib/data";
import { teamLabel } from "@/lib/labels";
import { acceptMatch, declineMatch } from "@/lib/matches";
import { rivalOf, teamOf, waitsFor, type Match, type Player } from "@/lib/types";

/** En la tabla: solo lo que espera una acción de la persona. El resto vive en Partidos. */
export async function OpenMatches() {
  const [me, players, matches] = await Promise.all([
    getMyId(),
    getPlayers(),
    getMyOpenMatches(),
  ]);
  const mine = matches.filter((match) => waitsFor(match, me));
  if (mine.length === 0) return null;

  return (
    <section aria-label="Te toca" className="mb-6">
      <ul className="space-y-2">
        {mine.map((match) => (
          <li key={match.id}>
            <OpenMatch match={match} me={me} players={players} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OpenMatch({
  match,
  me,
  players,
}: {
  match: Match;
  me: string;
  players: Map<string, Player>;
}) {
  const myTeam = teamOf(match, me)!;
  const rivals = teamLabel(match, rivalOf(myTeam), players);
  const href = `/partido/${match.id}`;

  if (match.status === "invited" && myTeam === "B") {
    return (
      <div className="rounded-2xl bg-pelota px-4 py-3 text-mesa-honda">
        <Link href={href} className="flex items-center justify-between gap-2 font-semibold">
          {rivals} te {match.kind === "2v2" ? "retan a un 2 contra 2" : "retó"}
          <IconIr />
        </Link>
        <div className="mt-3 flex gap-2">
          <form action={acceptMatch.bind(null, match.id)} className="flex-1">
            <SubmitButton className="w-full rounded-full bg-mesa-honda px-4 py-2 font-semibold text-linea">
              Aceptar
            </SubmitButton>
          </form>
          <form action={declineMatch.bind(null, match.id)}>
            <SubmitButton className="rounded-full border-2 border-mesa-honda px-4 py-2 font-semibold">
              Ahora no
            </SubmitButton>
          </form>
        </div>
      </div>
    );
  }

  const text =
    match.status === "invited"
      ? `Esperando que ${rivals} acepte el reto`
      : match.status === "playing"
        ? `En juego contra ${rivals}. Carga el marcador al terminar`
        : waitsFor(match, me)
          ? `Confirma el marcador contra ${rivals}`
          : `Esperando que ${rivals} confirme el marcador`;

  return (
    <Link
      href={href}
      className={`boton flex items-center justify-between gap-2 rounded-2xl px-4 py-3 ${
        waitsFor(match, me) ? "bg-pelota font-semibold text-mesa-honda" : "bg-mesa-clara"
      }`}
    >
      {text}
      <span className="shrink-0">
        <IconIr />
      </span>
    </Link>
  );
}
