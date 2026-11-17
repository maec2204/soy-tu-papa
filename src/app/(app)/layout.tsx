import { BottomNav } from "@/components/BottomNav";
import { LiveRefresh } from "@/components/LiveRefresh";
import { MockUserSwitch } from "@/components/MockUserSwitch";
import { TopBar } from "@/components/TopBar";
import { getMyId, getMyOpenMatches, getPlayers } from "@/lib/data";
import { MOCK } from "@/lib/mock/db";
import { waitsFor } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [me, players, open] = await Promise.all([
    getMyId(),
    getPlayers(),
    getMyOpenMatches(),
  ]);
  const pending = open.filter((match) => waitsFor(match, me)).length;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-32">
      {MOCK && <MockUserSwitch me={me} players={[...players.values()]} />}
      <TopBar me={me} />
      <main className="flex-1">{children}</main>
      <BottomNav me={me} pending={pending} />
      <LiveRefresh />
    </div>
  );
}
