import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser, setSessionCookie, toSessionUser } from "@/lib/auth";
import { getEmployee, getUser, getUserByEmail, upsertEmployee, upsertUser } from "@/lib/db";
import { publicProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = await getUser(auth.user.id);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  return NextResponse.json(publicProfile(user));
}

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = await getUser(auth.user.id);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    notifyEmail?: boolean;
  };

  const name = body.name?.trim() || "";
  const email = body.email?.trim().toLowerCase() || "";
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Enter a display name." }, { status: 400 });
  }
  if (!email || !email.includes("@") || email.length > 120) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  const taken = await getUserByEmail(email);
  if (taken && taken.id !== user.id) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }

  user.name = name;
  user.email = email;
  user.phone = (body.phone || "").trim().slice(0, 30);
  user.jobTitle = (body.jobTitle || "").trim().slice(0, 80);
  if (typeof body.notifyEmail === "boolean") user.notifyEmail = body.notifyEmail;
  await upsertUser(user);

  if (user.employeeId) {
    const employee = await getEmployee(user.employeeId);
    if (employee) {
      const parts = name.split(/\s+/).filter(Boolean);
      employee.firstName = parts[0] || employee.firstName;
      employee.lastName = parts.slice(1).join(" ");
      employee.email = email;
      await upsertEmployee(employee);
    }
  }

  revalidatePath("/", "layout");
  const response = NextResponse.json(publicProfile(user));
  await setSessionCookie(response, toSessionUser(user));
  return response;
}
