import Link from "next/link";
import { notFound } from "next/navigation";
import { ReleaseTable } from "@/components/ReleaseTable";
import { ScoreForm } from "@/components/ScoreForm";
import { SubmitButton } from "@/components/SubmitButton";
import { Table } from "@/components/Table";
import { getMatch, getMyId, getPlayers, getQueue, getTableSince } from "@/lib/data";
import { teamLabel, teamPlayers } from "@/lib/labels";
import {
  acceptMatch,
  cancelMatch,
  confirmScore,
  declineMatch,
  rejectScore,
} from "@/lib/matches";
import { rivalOf, teamOf, winnerOf, type Match, type Team } from "@/lib/types";

const primary =
  "w-full rounded-full bg-pelota px-6 py-4 text-lg font-semibold text-mesa-honda";
const secondary =
  "w-full rounded-full border-2 border-linea/50 px-6 py-4 text-lg font-semibold";

function Score({ match, team }: { match: Match; team: Team }) {
  const value = team === "A" ? match.score_a : match.score_b;
  if (value === null) return null;
  const lost = match.status === "confirmed" && winnerOf(match) !== team;
  return <span className={`marcador text-8xl ${lost ? "text-linea/40" : ""}`}>{value}</span>;
}

export default async function MatchPage({ params }: PageProps<"/partido/[id]">) {
  const { id } = await params;
  const [me, players, match] = await Promise.all([getMyId(), getPlayers(), getMatch(id)]);
  if (!match) notFound();

  const myTeam = teamOf(match, me);
  const teamA = teamPlayers(match, "A", players);
  const teamB = teamPlayers(match, "B", players);
  const labelA = teamLabel(match, "A", players);
  const labelB = teamLabel(match, "B", players);
  const rivals = myTeam ? teamLabel(match, rivalOf(myTeam), players) : "";

  const table = (
    <Table
      teamA={teamA}
      teamB={teamB}
      scoreA={<Score match={match} team="A" />}
      scoreB={<Score match={match} team="B" />}
      winner={match.status === "confirmed" ? winnerOf(match) : null}
    />
  );

  let title: string;
  let body: React.ReactNode = null;

  if (match.status === "invited") {
    title = myTeam === "B" ? "Te retaron" : "Reto enviado";
    body =
      myTeam === "B" ? (
        <div className="mt-6 space-y-3">
          <form action={acceptMatch.bind(null, match.id)}>
            <SubmitButton className={primary}>Aceptar</SubmitButton>
          </form>
          <form action={declineMatch.bind(null, match.id)}>
            <SubmitButton className={secondary}>Ahora no</SubmitButton>
          </form>
        </div>
      ) : (
        <p className="mt-6 text-lg text-linea/80">
          {myTeam ? `Esperando que ${rivals} acepte.` : "Todavía no lo aceptan."}
        </p>
      );
  } else if (match.status === "declined") {
    title = "Reto rechazado";
    body = <p className="mt-6 text-lg text-linea/80">Este partido no se jugó.</p>;
  } else if (match.status === "cancelled") {
    title = "Partido cancelado";
    body = <p className="mt-6 text-lg text-linea/80">Este partido no se jugó.</p>;
  } else if (match.status === "playing") {
    // Con marcador ya cargado alguna vez no se cancela: se vuelve a cargar y se confirma.
    const cancel = myTeam && !match.played_at && (
      <form action={cancelMatch.bind(null, match.id)} className="mt-3">
        <SubmitButton className={secondary}>Cancelar partido</SubmitButton>
      </form>
    );
    if (match.queue_position) {
      // La mesa es una sola: este partido espera a los que se aceptaron antes.
      const [queue, tableSince] = await Promise.all([getQueue(), getTableSince()]);
      const onTable = queue[0];
      const releaseAt = new Date(tableSince!.getTime() + 20 * 60_000).toISOString();
      title = "En cola";
      body = (
        <>
          <p className="mt-6 text-lg">
            Puesto {match.queue_position} en la cola. Ahora juegan{" "}
            {teamLabel(onTable, "A", players)} contra {teamLabel(onTable, "B", players)}.
          </p>
          <p className="mt-1 text-linea/80">
            {myTeam
              ? "Cuando les toque la mesa van a poder cargar el marcador."
              : "Todavía no les toca la mesa."}
          </p>
          {myTeam && <ReleaseTable availableAt={releaseAt} />}
          {cancel}
        </>
      );
    } else {
      title = "En juego";
      if (myTeam) {
        return (
          <>
            <h1 className="mb-4 font-display text-5xl font-bold">{title}</h1>
            <ScoreForm
              matchId={match.id}
              teamA={teamA}
              teamB={teamB}
              labelA={labelA}
              labelB={labelB}
            />
            {cancel}
          </>
        );
      }
    }
  } else if (match.status === "awaiting_confirmation") {
    const reporterTeam = teamOf(match, match.reported_by!)!;
    const canConfirm = myTeam !== null && myTeam !== reporterTeam;
    title = canConfirm ? "¿Así quedó?" : "Por confirmar";
    body = canConfirm ? (
      <div className="mt-6 space-y-3">
        <form action={confirmScore.bind(null, match.id)}>
          <SubmitButton className={primary}>Confirmar marcador</SubmitButton>
        </form>
        <form action={rejectScore.bind(null, match.id)}>
          <SubmitButton className={secondary}>No es correcto</SubmitButton>
        </form>
      </div>
    ) : (
      <p className="mt-6 text-lg text-linea/80">
        {myTeam
          ? `Esperando que ${rivals} confirme. Hasta entonces no cuenta.`
          : "Falta que el otro lado confirme. Hasta entonces no cuenta."}
      </p>
    );
  } else {
    const winner = winnerOf(match);
    title = `Ganó ${winner === "A" ? labelA : labelB}`;
    if (match.kind === "2v2") title = `Ganaron ${winner === "A" ? labelA : labelB}`;
    body = (
      <>
        <p className="mt-6 text-lg">
          {myTeam === null
            ? `${match.rating_delta} puntos cambiaron de lado.`
            : myTeam === winner
              ? `Sumas ${match.rating_delta} puntos.`
              : `Pierdes ${match.rating_delta} puntos.`}
        </p>
        <Link href="/" className={`${secondary} boton mt-6 block text-center`}>
          Ver la tabla
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-4 font-display text-5xl font-bold">{title}</h1>
      {table}
      {body}
    </>
  );
}
