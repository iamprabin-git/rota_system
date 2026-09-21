import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getEmployee } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (user?.role !== "user" || !user.employeeId) redirect("/login");
  if (!(await getEmployee(user.employeeId))) redirect("/login");
  return <>{children}</>;
}
