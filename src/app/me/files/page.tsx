import { redirect } from "next/navigation";
import { FilesBoard } from "@/components/FilesBoard";
import { getSession } from "@/lib/auth";
import { getEmployee, listFiles } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MyFilesPage() {
  const user = await getSession();
  if (!user?.employeeId) redirect("/login");
  const employee = getEmployee(user.employeeId);
  if (!employee) redirect("/login");

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-ink-soft">Keep hour-tracking paperwork with the rest of your pay record.</p>
      <FilesBoard employee={employee} files={listFiles(employee.id)} />
    </div>
  );
}
