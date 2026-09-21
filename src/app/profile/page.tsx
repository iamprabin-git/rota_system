import { PageHeading } from "@/components/PageHeading";
import { ProfileForm } from "@/components/ProfileForm";
import { requirePage } from "@/lib/auth";
import { getEmployee, getUser } from "@/lib/db";
import { publicProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requirePage();
  const user = await getUser(session.id);
  if (!user) return <p className="text-ink-soft">Account not found.</p>;
  const employee = user.employeeId ? await getEmployee(user.employeeId) : undefined;

  return (
    <div className="space-y-6">
      <PageHeading description="Your photo, sign-in details and password apply across the admin, agent and user panels." />
      <ProfileForm profile={publicProfile(user)} jobHint={employee?.jobTitle} />
    </div>
  );
}
