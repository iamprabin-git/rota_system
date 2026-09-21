import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { getUser, upsertUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = await getUser(auth.user.id);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const body = (await request.json()) as { current?: string; next?: string };
  const current = body.current || "";
  const next = body.next || "";
  if (!current || !next) {
    return NextResponse.json({ error: "Enter your current and new password." }, { status: 400 });
  }
  if (next.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }
  if (!verifyPassword(current, user.passwordHash)) {
    return NextResponse.json({ error: "Current password is not correct." }, { status: 400 });
  }
  user.passwordHash = hashPassword(next);
  await upsertUser(user);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
