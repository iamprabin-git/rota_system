import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canAccessEmployee, scopedCompanyId } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { listRota, upsertRotaEntry } from "@/lib/db";
import type { RotaEntry } from "@/lib/types";
import { emptyDays } from "@/lib/uk-payroll";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser("agent", "user");
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const weekStart = searchParams.get("weekStart") || undefined;
  if (auth.user.role === "user") {
    if (!auth.user.employeeId) return NextResponse.json({ error: "No staff record is linked." }, { status: 403 });
    const entries = (await listRota(weekStart, auth.user.companyId || undefined)).filter(
      (entry) => entry.employeeId === auth.user.employeeId,
    );
    return NextResponse.json(entries);
  }
  const companyId = scopedCompanyId(auth.user);
  if (!companyId) return NextResponse.json({ error: "No company is linked to this agent." }, { status: 403 });
  return NextResponse.json(await listRota(weekStart, companyId));
}

export async function PUT(request: Request) {
  const auth = await requireUser("agent");
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<RotaEntry>;
  if (!body.employeeId || !body.weekStart) {
    return NextResponse.json({ error: "Employee and week start are required." }, { status: 400 });
  }
  if (!await canAccessEmployee(auth.user, body.employeeId)) {
    return NextResponse.json({ error: "That person is not in your company." }, { status: 403 });
  }
  const entry: RotaEntry = {
    id: body.id || `rota_${body.employeeId}_${body.weekStart}`,
    employeeId: body.employeeId,
    weekStart: body.weekStart,
    days: { ...emptyDays(), ...body.days },
    overtimeHours: Number(body.overtimeHours) || 0,
    notes: body.notes || "",
  };
  const saved = await upsertRotaEntry(entry);
  revalidatePath("/", "layout");
  return NextResponse.json(saved);
}
