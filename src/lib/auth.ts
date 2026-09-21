import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { homePath } from "./roles";
import { createSessionToken, readSessionToken, SESSION_COOKIE, SESSION_DAYS } from "./session-token";
import type { SessionUser, UserRole } from "./types";

export { SESSION_COOKIE, createSessionToken, readSessionToken };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const check = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== check.length) return false;
  return timingSafeEqual(expected, check);
}

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
  const user = await getSession();
  if (!user) {
    return { error: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  }
  if (roles.length && !roles.includes(user.role)) {
    return { error: NextResponse.json({ error: "You do not have access." }, { status: 403 }) };
  }
  return { user };
}

export async function requirePage(...roles: UserRole[]): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  if (roles.length && !roles.includes(user.role)) redirect(homePath(user.role));
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
