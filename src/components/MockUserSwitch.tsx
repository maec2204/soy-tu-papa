"use client";

import { switchMockUser } from "@/lib/matches";
import type { Player } from "@/lib/types";

/** Solo en modo demo: elegir como quién se está viendo la app. */
export function MockUserSwitch({ me, players }: { me: string; players: Player[] }) {
  return (
    <form action={switchMockUser} className="-mx-4 bg-linea px-4 py-2 text-sm text-mesa-honda">
      <label className="flex items-center gap-2">
        Demo. Viendo como
        <select
          name="player"
          value={me}
          onChange={(e) => e.target.form?.requestSubmit()}
          className="flex-1 rounded-md border border-mesa-honda/30 bg-white px-2 py-1 font-semibold"
        >
          {players
            .toSorted((a, b) => a.name.localeCompare(b.name))
            .map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
        </select>
      </label>
    </form>
  );
}
