import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { assertCompanyAllowed } from "./access";
import { accountMessage, accountStatus, isAccountActive } from "./approvals";
import { getUser } from "./db";
import { hashPassword, verifyPassword } from "./passwords";
import { homePath } from "./roles";
import { createSessionToken, readSessionToken, SESSION_COOKIE, SESSION_DAYS } from "./session-token";
import type { SessionUser, UserRole } from "./types";

export { SESSION_COOKIE, createSessionToken, readSessionToken, hashPassword, verifyPassword };

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser(...roles: UserRole[]): Promise<
  { user: SessionUser; error?: undefined } | { user?: undefined; error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  }
  const stored = await getUser(session.id);
  if (stored && !isAccountActive(stored)) {
    return { error: NextResponse.json({ error: accountMessage(accountStatus(stored)) }, { status: 403 }) };
  }
  const user = stored ? toSessionUser(stored) : session;
  if (roles.length && !roles.includes(user.role)) {
    return { error: NextResponse.json({ error: "You do not have access." }, { status: 403 }) };
  }
  const companyGate = await assertCompanyAllowed(user);
  if (!companyGate.ok) {
    return { error: NextResponse.json({ error: companyGate.error, reason: companyGate.reason }, { status: 403 }) };
  }
  return { user };
}

export async function requirePage(...roles: UserRole[]): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  const stored = await getUser(session.id);
  if (stored && !isAccountActive(stored)) redirect("/login");
  const user = stored ? toSessionUser(stored) : session;
  if (roles.length && !roles.includes(user.role)) redirect(homePath(user.role));
  const companyGate = await assertCompanyAllowed(user);
  if (!companyGate.ok) redirect(`/login?reason=${companyGate.reason}`);
  return user;
}

export function toSessionUser(user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  employeeId: string | null;
  avatar?: string;
}): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    employeeId: user.employeeId,
    avatar: user.avatar || "",
  };
}

export async function setSessionCookie(response: NextResponse, user: SessionUser) {
  response.cookies.set(SESSION_COOKIE, await createSessionToken(user), sessionCookieOptions());
  return response;
}
