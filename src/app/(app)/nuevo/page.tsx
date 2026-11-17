import { NewMatchForm, type Opponent } from "@/components/NewMatchForm";
import { getFatherhoods, getHeadToHead, getMyId, getPlayers } from "@/lib/data";

export default async function NewMatchPage() {
  const me = await getMyId();
  const [players, headToHead, fatherhoods] = await Promise.all([
    getPlayers(),
    getHeadToHead(me),
    getFatherhoods(me),
  ]);

  const opponents: Opponent[] = [...players.values()]
    .filter((p) => p.id !== me)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((player) => ({
      player,
      myWins: headToHead.find((h) => h.loser_id === player.id)?.wins ?? 0,
      theirWins: headToHead.find((h) => h.winner_id === player.id)?.wins ?? 0,
      isMyChild: fatherhoods.some((f) => f.child_id === player.id),
      isMyFather: fatherhoods.some((f) => f.father_id === player.id),
    }));

  return (
    <>
      <h1 className="font-display text-5xl font-bold">¿Contra quién?</h1>
      {opponents.length === 0 ? (
        <p className="mt-4 max-w-[30ch] text-lg text-linea/80">
          Todavía no ha entrado nadie más. Pasa el enlace a tus compañeros.
        </p>
      ) : (
        <NewMatchForm opponents={opponents} />
      )}
    </>
  );
}
