import type { Match, Player, Team } from "./types";
import { teamIds } from "./types";

export function firstName(player: Player): string {
  return player.name.split(" ")[0];
}

/** "Ana" o "Ana y Luis". */
export function teamLabel(match: Match, team: Team, players: Map<string, Player>): string {
  return teamIds(match, team)
    .map((id) => firstName(players.get(id)!))
    .join(" y ");
}

export function teamPlayers(match: Match, team: Team, players: Map<string, Player>): Player[] {
  return teamIds(match, team).map((id) => players.get(id)!);
}
