import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { buildNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  return NextResponse.json(await buildNotifications(auth.user));
}
