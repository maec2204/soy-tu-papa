import Link from "next/link";
import { teamLabel } from "@/lib/labels";
import { rivalOf, teamOf, winnerOf, type Match, type Player } from "@/lib/types";

/** Un partido confirmado visto desde un jugador: contra quién, marcador y puntos ganados o perdidos. */
export function MatchRow({
  match,
  playerId,
  players,
  own = false,
}: {
  match: Match;
  playerId: string;
  players: Map<string, Player>;
  /** true cuando la fila habla de quien mira ("Le ganaste a"). */
  own?: boolean;
}) {
  const team = teamOf(match, playerId)!;
  const won = winnerOf(match) === team;
  const mine = team === "A" ? match.score_a : match.score_b;
  const theirs = team === "A" ? match.score_b : match.score_a;
  const verb = own
    ? won
      ? "Le ganaste a"
      : "Perdiste con"
    : won
      ? "Le ganó a"
      : "Perdió con";

  return (
    <Link href={`/partido/${match.id}`} className="flex items-center gap-3 py-3">
      <span className="flex-1 truncate">
        {verb} {teamLabel(match, rivalOf(team), players)}
      </span>
      <span className="marcador text-2xl">
        {mine}–{theirs}
      </span>
      <span
        className={`marcador w-10 text-right text-xl ${won ? "text-pelota" : "text-goma"}`}
      >
        {won ? "+" : "−"}
        {match.rating_delta}
      </span>
    </Link>
  );
}
