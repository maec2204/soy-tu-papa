"use client";

import { useState } from "react";
import { Avatar } from "@/components/Avatar";
import { SubmitButton } from "@/components/SubmitButton";
import { createMatch } from "@/lib/matches";
import type { MatchKind, Player } from "@/lib/types";

export type Opponent = {
  player: Player;
  myWins: number;
  theirWins: number;
  isMyChild: boolean;
  isMyFather: boolean;
};

function record({ myWins, theirWins }: Opponent): string {
  if (myWins + theirWins === 0) return "Sin partidos entre ustedes";
  if (myWins > theirWins) return `Le ganas ${myWins} a ${theirWins}`;
  if (myWins < theirWins) return `Te gana ${theirWins} a ${myWins}`;
  return `Van ${myWins} a ${theirWins}`;
}

export function NewMatchForm({ opponents }: { opponents: Opponent[] }) {
  const [kind, setKind] = useState<MatchKind>("1v1");
  const [rivals, setRivals] = useState<string[]>([]);
  const [partner, setPartner] = useState<string | null>(null);

  const rivalsNeeded = kind === "1v1" ? 1 : 2;
  const ready = rivals.length === rivalsNeeded && (kind === "1v1" || partner !== null);

  function changeKind(next: MatchKind) {
    setKind(next);
    setRivals([]);
    setPartner(null);
  }

  function toggleRival(id: string) {
    if (partner === id) setPartner(null);
    setRivals((current) => {
      if (current.includes(id)) return current.filter((r) => r !== id);
      if (kind === "1v1") return [id];
      return current.length < 2 ? [...current, id] : current;
    });
  }

  function togglePartner(id: string) {
    setRivals((current) => current.filter((r) => r !== id));
    setPartner((current) => (current === id ? null : id));
  }

  const chip = (on: boolean) =>
    `rounded-full border-2 px-3 py-1.5 text-sm font-semibold ${
      on ? "border-pelota bg-pelota text-mesa-honda" : "border-linea/40"
    }`;

  return (
    <form action={createMatch} className="mt-4">
      <input type="hidden" name="kind" value={kind} />
      {partner && <input type="hidden" name="partner" value={partner} />}
      {rivals.map((id) => (
        <input key={id} type="hidden" name="rival" value={id} />
      ))}

      <div role="group" aria-label="Tipo de partido" className="flex gap-2">
        <button
          type="button"
          aria-pressed={kind === "1v1"}
          onClick={() => changeKind("1v1")}
          className={`flex-1 ${chip(kind === "1v1")} py-2.5 text-base`}
        >
          1 contra 1
        </button>
        <button
          type="button"
          aria-pressed={kind === "2v2"}
          onClick={() => changeKind("2v2")}
          className={`flex-1 ${chip(kind === "2v2")} py-2.5 text-base`}
        >
          2 contra 2
        </button>
      </div>

      <p className="mt-5 text-linea/80">
        {kind === "1v1"
          ? "Elige a tu rival."
          : "Elige a tu pareja y a los dos rivales."}
      </p>

      <ul className="mt-2 divide-y divide-linea/15 pb-24">
        {opponents.map((opponent) => {
          const { player } = opponent;
          const isRival = rivals.includes(player.id);
          return (
            <li key={player.id} className="flex items-center gap-3 py-3">
              <Avatar player={player} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-semibold">{player.name}</span>
                <span className="block text-sm text-linea/70">{record(opponent)}</span>
                {opponent.isMyChild && (
                  <span className="block text-sm font-semibold text-pelota">
                    Eres su papá
                  </span>
                )}
                {opponent.isMyFather && (
                  <span className="block text-sm font-semibold text-goma">Es tu papá</span>
                )}
              </span>
              {kind === "2v2" && (
                <button
                  type="button"
                  aria-pressed={partner === player.id}
                  onClick={() => togglePartner(player.id)}
                  className={chip(partner === player.id)}
                >
                  Pareja
                </button>
              )}
              <button
                type="button"
                aria-pressed={isRival}
                onClick={() => toggleRival(player.id)}
                className={chip(isRival)}
              >
                Rival
              </button>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-mesa from-60% px-4 pt-8 pb-5">
        <SubmitButton
          disabled={!ready}
          className="mx-auto block w-full max-w-md rounded-full bg-pelota px-6 py-4 text-lg font-semibold text-mesa-honda disabled:opacity-40"
        >
          Empezar
        </SubmitButton>
      </div>
    </form>
  );
}
