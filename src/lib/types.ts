export type Team = "A" | "B";
export type MatchKind = "1v1" | "2v2";
export type MatchStatus =
  | "invited"
  | "playing"
  | "awaiting_confirmation"
  | "confirmed"
  | "declined"
  | "cancelled";

export type Player = {
  id: string;
  name: string;
  avatar_url: string | null;
  rating: number;
  wins: number;
  losses: number;
  current_streak: number;
  best_streak: number;
};

export type Match = {
  id: string;
  kind: MatchKind;
  status: MatchStatus;
  created_by: string;
  score_a: number | null;
  score_b: number | null;
  reported_by: string | null;
  rating_delta: number | null;
  confirmed_at: string | null;
  queued_at: string | null;
  played_at: string | null;
  /** 0 = en la mesa, 1 = primero en la cola… null = no ocupa ni espera la mesa. */
  queue_position: number | null;
  match_players: { team: Team; player_id: string }[];
};

export type HeadToHead = { winner_id: string; loser_id: string; wins: number };

export type Fatherhood = {
  father_id: string;
  child_id: string;
  wins: number;
  losses: number;
};

export function teamOf(match: Match, playerId: string): Team | null {
  return match.match_players.find((p) => p.player_id === playerId)?.team ?? null;
}

export function teamIds(match: Match, team: Team): string[] {
  return match.match_players.filter((p) => p.team === team).map((p) => p.player_id);
}

export function winnerOf(match: Match): Team {
  return match.score_a! > match.score_b! ? "A" : "B";
}

export function rivalOf(team: Team): Team {
  return team === "A" ? "B" : "A";
}

/** ¿El partido espera una acción de esta persona? (aceptar, cargar o confirmar el marcador) */
export function waitsFor(match: Match, playerId: string): boolean {
  const team = teamOf(match, playerId);
  if (!team) return false;
  if (match.status === "invited") return team === "B";
  // En cola no hay nada que hacer hasta que toque la mesa.
  if (match.status === "playing") return !match.queue_position;
  if (match.status === "awaiting_confirmation") {
    return teamOf(match, match.reported_by!) !== team;
  }
  return false;
}
