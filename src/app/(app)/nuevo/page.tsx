import { EmptyState } from "@/components/EmptyState";
import { NewMatchForm, type Opponent } from "@/components/NewMatchForm";
import { getFatherhoods, getHeadToHead, getMyId, getPlayers, getQueue } from "@/lib/data";
import { teamLabel } from "@/lib/labels";

export default async function NewMatchPage() {
  const me = await getMyId();
  const [players, headToHead, fatherhoods, queue] = await Promise.all([
    getPlayers(),
    getHeadToHead(me),
    getFatherhoods(me),
    getQueue(),
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
        <EmptyState title="Todavía no hay rivales">
          Nadie más ha entrado. Pasa el enlace a tus compañeros: cuando creen su clave van a
          aparecer aquí.
        </EmptyState>
      ) : (
        <>
          {queue.length > 0 && (
            <p role="status" className="mt-4 rounded-2xl bg-mesa-clara px-4 py-3">
              <span className="font-semibold">La mesa está ocupada.</span> Juegan{" "}
              {teamLabel(queue[0], "A", players)} contra {teamLabel(queue[0], "B", players)}
              {queue.length > 1 && ` y hay ${queue.length - 1} en cola`}. Si retas ahora, tu
              partido queda en el puesto {queue.length} de la cola.
            </p>
          )}
          <NewMatchForm opponents={opponents} />
        </>
      )}
    </>
  );
}
