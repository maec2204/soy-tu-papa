import type { Player } from "@/lib/types";

export function Avatar({ player, size = 40 }: { player: Player; size?: number }) {
  const style = { width: size, height: size };

  if (player.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={player.avatar_url}
        alt=""
        referrerPolicy="no-referrer"
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-mesa-clara font-display text-lg font-semibold"
    >
      {player.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
