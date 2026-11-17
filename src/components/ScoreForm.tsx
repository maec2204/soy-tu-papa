"use client";

import { useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { Table } from "@/components/Table";
import { reportScore } from "@/lib/matches";
import type { Player } from "@/lib/types";

export function ScoreForm({
  matchId,
  teamA,
  teamB,
  labelA,
  labelB,
}: {
  matchId: string;
  teamA: Player[];
  teamB: Player[];
  labelA: string;
  labelB: string;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const ready = a !== "" && b !== "" && a !== b;

  const input = (name: string, label: string, value: string, set: (v: string) => void) => (
    <input
      name={name}
      aria-label={`Puntos de ${label}`}
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      placeholder="0"
      value={value}
      onChange={(e) => set(e.target.value.replace(/\D/g, ""))}
      className="marcador w-28 rounded-2xl bg-mesa-clara py-2 text-center text-7xl placeholder:text-linea/30"
    />
  );

  return (
    <form action={reportScore.bind(null, matchId)}>
      <Table
        teamA={teamA}
        teamB={teamB}
        scoreA={input("score_a", labelA, a, setA)}
        scoreB={input("score_b", labelB, b, setB)}
      />
      <SubmitButton
        disabled={!ready}
        className="mt-6 w-full rounded-full bg-pelota px-6 py-4 text-lg font-semibold text-mesa-honda disabled:opacity-40"
      >
        Cargar marcador
      </SubmitButton>
      <p className="mt-3 text-center text-sm text-linea/70">
        El otro lado tiene que confirmarlo para que cuente.
      </p>
    </form>
  );
}
