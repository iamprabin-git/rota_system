import { HoursReview } from "@/components/HoursReview";
import { requirePage } from "@/lib/auth";
import { listEmployees, listHourLogs } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AgentHoursPage() {
  const user = await requirePage("agent");
  const companyId = user.companyId || undefined;
  const employees = await listEmployees(companyId);
  const logs = await listHourLogs(undefined, companyId);
  return <HoursReview employees={employees} logs={logs} />;
}
