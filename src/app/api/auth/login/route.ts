import { NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, toSessionUser, verifyPassword } from "@/lib/auth";
import { getUserByEmail } from "@/lib/db";
import { homePath } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() || "";
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Those details were not recognised." }, { status: 401 });
  }
  const session = toSessionUser(user);
  const response = NextResponse.json({
    user: session,
    redirect: homePath(user.role),
  });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(session), sessionCookieOptions());
  return response;
}
