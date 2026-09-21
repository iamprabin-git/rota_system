import { redirect } from "next/navigation";
import { PayCalculators } from "@/components/PayCalculators";
import { getSession } from "@/lib/auth";
import { getEmployee } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MyCalculatorsPage() {
  const user = await getSession();
  if (!user?.employeeId) redirect("/login");
  const employee = await getEmployee(user.employeeId);
  if (!employee) redirect("/login");

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">
        Work out shift hours, gross pay from your rate, and an estimated take-home using your tax and NI settings.
      </p>
      <PayCalculators employee={employee} />
    </div>
  );
}
