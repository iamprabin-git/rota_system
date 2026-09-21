import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { homePath } from "@/lib/roles";
import { readSessionToken, SESSION_COOKIE } from "@/lib/session-token";
import type { UserRole } from "@/lib/types";

const PUBLIC_PATHS = ["/login"];

const LEGACY_AGENT: Record<string, string> = {
  "/employees": "/agent/employees",
  "/rota": "/agent/rota",
  "/settings": "/agent/settings",
  "/payslips": "/agent/payslips",
  "/payslips/new": "/agent/payslips/new",
};

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/api/auth/login") || pathname.startsWith("/api/auth/logout")) return true;
  return false;
}

function panelFor(pathname: string): UserRole | null {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/agent" || pathname.startsWith("/agent/")) return "agent";
  if (pathname === "/me" || pathname.startsWith("/me/")) return "user";
  if (pathname === "/employees" || pathname.startsWith("/employees/")) return "agent";
  if (pathname === "/rota" || pathname.startsWith("/rota/")) return "agent";
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return "agent";
  if (pathname === "/payslips/new") return "agent";
  if (pathname === "/payslips") return "agent";
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|ico|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  const user = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!user && !isPublic(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Please sign in." }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL(homePath(user.role), request.url));
  }

  if (user && pathname === "/") {
    return NextResponse.redirect(new URL(homePath(user.role), request.url));
  }

  if (user && LEGACY_AGENT[pathname] && user.role === "agent") {
    return NextResponse.redirect(new URL(LEGACY_AGENT[pathname], request.url));
  }

  const panel = panelFor(pathname);
  if (user && panel && user.role !== panel) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "You do not have access." }, { status: 403 });
    }
    return NextResponse.redirect(new URL(homePath(user.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
