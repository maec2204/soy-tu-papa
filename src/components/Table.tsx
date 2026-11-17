import type { ReactNode } from "react";
import { Avatar } from "@/components/Avatar";
import type { Player, Team } from "@/lib/types";

/** La mesa vista desde arriba: un equipo a cada lado de la red, con su marcador. */
export function Table({
  teamA,
  teamB,
  scoreA,
  scoreB,
  winner = null,
}: {
  teamA: Player[];
  teamB: Player[];
  scoreA: ReactNode;
  scoreB: ReactNode;
  /** Con ganador, la pelota cruza la mesa desde su lado. */
  winner?: Team | null;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-4 border-linea bg-mesa-honda">
      {winner && (
        <span aria-hidden className={`pelota ${winner === "B" ? "pelota-vuelve" : ""}`} />
      )}
      <Side team={teamA} score={scoreA} />
      <div className="red" />
      <Side team={teamB} score={scoreB} />
    </div>
  );
}

function Side({ team, score }: { team: Player[]; score: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-7">
      <ul className="min-w-0 space-y-2">
        {team.map((player) => (
          <li key={player.id} className="flex items-center gap-2">
            <Avatar player={player} size={32} />
            <span className="truncate text-lg font-semibold">{player.name}</span>
          </li>
        ))}
      </ul>
      {score}
    </div>
  );
}
