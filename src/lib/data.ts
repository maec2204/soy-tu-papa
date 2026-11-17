import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { MOCK, mockQuery, mockUserId } from "./mock/db";
import type { Fatherhood, HeadToHead, Match, Player } from "./types";

const MOCK_MATCHES = `
  select m.*, (
    select json_agg(json_build_object('team', mp.team, 'player_id', mp.player_id))
    from public.match_players mp where mp.match_id = m.id
  ) as match_players
  from public.matches m`;
const MOCK_PLAYS = `exists (
  select 1 from public.match_players mp where mp.match_id = m.id and mp.player_id = $1)`;

const MATCH_COLUMNS = "*, match_players(team, player_id)";

export const getMyId = cache(async (): Promise<string> => {
  if (MOCK) return mockUserId();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return data.user.id;
});

export const getPlayers = cache(async (): Promise<Map<string, Player>> => {
  if (MOCK) {
    const rows = await mockQuery<Player>(
      `select * from public.players order by rating desc, wins desc`,
    );
    return new Map(rows.map((p) => [p.id, p]));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("*")
    .order("rating", { ascending: false })
    .order("wins", { ascending: false });
  return new Map((data as Player[]).map((p) => [p.id, p]));
});

/** Partidos sin terminar en los que juega la persona: retos, en juego y por confirmar. */
export const getMyOpenMatches = cache(async (): Promise<Match[]> => {
  const me = await getMyId();
  if (MOCK) {
    return mockQuery<Match>(
      `${MOCK_MATCHES} where m.status in ('invited', 'playing', 'awaiting_confirmation')
       and ${MOCK_PLAYS} order by m.created_at desc`,
      [me],
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(MATCH_COLUMNS)
    .in("status", ["invited", "playing", "awaiting_confirmation"])
    .order("created_at", { ascending: false });
  return (data as Match[]).filter((m) =>
    m.match_players.some((p) => p.player_id === me),
  );
});

export async function getMatch(id: string): Promise<Match | null> {
  if (MOCK) {
    const rows = await mockQuery<Match>(`${MOCK_MATCHES} where m.id::text = $1`, [id]);
    return rows[0] ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(MATCH_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data as Match | null;
}

export async function getRecentMatches(playerId: string): Promise<Match[]> {
  if (MOCK) {
    return mockQuery<Match>(
      `${MOCK_MATCHES} where m.status = 'confirmed' and ${MOCK_PLAYS}
       order by m.confirmed_at desc limit 20`,
      [playerId],
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(`${MATCH_COLUMNS}, mine:match_players!inner(player_id)`)
    .eq("mine.player_id", playerId)
    .eq("status", "confirmed")
    .order("confirmed_at", { ascending: false })
    .limit(20);
  return data as Match[];
}

export async function getHeadToHead(playerId: string): Promise<HeadToHead[]> {
  if (MOCK) {
    return mockQuery<HeadToHead>(
      `select * from public.head_to_head where $1 in (winner_id, loser_id)`,
      [playerId],
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("head_to_head")
    .select("*")
    .or(`winner_id.eq.${playerId},loser_id.eq.${playerId}`);
  return data as HeadToHead[];
}

export async function getFatherhoods(playerId: string): Promise<Fatherhood[]> {
  if (MOCK) {
    return mockQuery<Fatherhood>(
      `select * from public.fatherhoods where $1 in (father_id, child_id)`,
      [playerId],
    );
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("fatherhoods")
    .select("*")
    .or(`father_id.eq.${playerId},child_id.eq.${playerId}`);
  return data as Fatherhood[];
}
