import { UserManager } from "@/components/UserManager";
import { accountStatus } from "@/lib/approvals";
import { requirePage } from "@/lib/auth";
import { listEmployees, listUsers } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AgentUsersPage() {
  const user = await requirePage("agent");
  const companyId = user.companyId || undefined;
  const employees = await listEmployees(companyId);
  const users = (await listUsers(companyId))
    .filter((item) => item.role === "user")
    .map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      employeeId: item.employeeId,
      status: accountStatus(item),
      phone: item.phone,
      jobTitle: item.jobTitle,
    }));
  return <UserManager employees={employees} users={users} />;
}
