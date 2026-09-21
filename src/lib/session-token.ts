import type { SessionUser } from "./types";

export const SESSION_COOKIE = "rs_session";
export const SESSION_DAYS = 7;

function secret() {
  return process.env.AUTH_SECRET || "rotasystem-local-dev-secret-2026";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((value.length * 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function publicUser(user: SessionUser): SessionUser {
  const role = (user.role as string) === "staff" ? "user" : user.role;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    companyId: user.companyId ?? null,
    employeeId: user.employeeId,
    avatar: user.avatar || "",
  };
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  const payload = bytesToBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        ...publicUser(user),
        exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
      }),
    ),
  );
  const signature = await hmac(payload);
  return `${payload}.${signature}`;
}

export async function readSessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const expected = await hmac(payload);
  if (signature.length !== expected.length) return null;
  let different = 0;
  for (let i = 0; i < signature.length; i += 1) {
    different |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (different !== 0) return null;
  try {
    const json = new TextDecoder().decode(base64UrlToBytes(payload));
    const data = JSON.parse(json) as SessionUser & { exp?: number };
    if (!data.exp || data.exp < Date.now() || !data.id || !data.role) return null;
    return publicUser(data);
  } catch {
    return null;
  }
}
