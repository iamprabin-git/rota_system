import { RotaBoard } from "@/components/RotaBoard";
import { requirePage } from "@/lib/auth";
import { listEmployees, listRota } from "@/lib/db";
import { startOfWeek } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgentRotaPage() {
  const user = await requirePage("agent");
  const weekStart = startOfWeek();
  const companyId = user.companyId || undefined;
  return (
    <RotaBoard
      employees={listEmployees(companyId)}
      initialWeek={weekStart}
      initialRota={listRota(weekStart, companyId)}
    />
  );
}
