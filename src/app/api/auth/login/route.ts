import { NextResponse } from "next/server";
import { assertCompanyAllowed } from "@/lib/access";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions, toSessionUser, verifyPassword } from "@/lib/auth";
import { getUserByLogin } from "@/lib/db";
import { requireLiveDatabase } from "@/lib/db-guard";
import { homePath } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const missing = requireLiveDatabase();
    if (missing) return missing;
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";
    if (!email) {
      return NextResponse.json(
        { error: "Enter your email or login ID.", reason: "missing_email" },
        { status: 400 },
      );
    }
    if (!password) {
      return NextResponse.json({ error: "Enter your password.", reason: "missing_password" }, { status: 400 });
    }
    const user = await getUserByLogin(email);
    if (!user) {
      return NextResponse.json(
        { error: "No account was found for this email or login ID.", reason: "unknown_email" },
        { status: 401 },
      );
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Incorrect password. Check your password and try again.", reason: "wrong_password" },
        { status: 401 },
      );
    }
    if (user.status === "pending") {
      return NextResponse.json(
        { error: "This login is waiting for payroll to approve it.", reason: "pending" },
        { status: 403 },
      );
    }
    if (user.status === "disabled") {
      return NextResponse.json({ error: "This login has been disabled.", reason: "disabled" }, { status: 403 });
    }
    const companyGate = await assertCompanyAllowed(user);
    if (!companyGate.ok) {
      return NextResponse.json({ error: companyGate.error, reason: companyGate.reason }, { status: 403 });
    }
    const session = toSessionUser(user);
    const response = NextResponse.json({
      user: session,
      redirect: homePath(user.role),
    });
    response.cookies.set(SESSION_COOKIE, await createSessionToken(session), sessionCookieOptions());
    return response;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Enter your email and password.", reason: "invalid" }, { status: 400 });
    }
    console.error(error);
    const message = error instanceof Error ? error.message : "";
    const unreachable = /fetch failed|ECONNRESET|ENOTFOUND|ETIMEDOUT|ECONNREFUSED|timeout|Connect/i.test(message);
    return NextResponse.json(
      {
        error: unreachable
          ? "Could not reach the database. Please try again."
          : "Sign-in failed. Please try again.",
        reason: "server",
      },
      { status: 500 },
    );
  }
}
