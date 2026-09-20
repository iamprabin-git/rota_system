import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { homePath } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSession();
  redirect(user ? homePath(user.role) : "/login");
}
