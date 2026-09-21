import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canAccessEmployee, ownEmployeeId, scopedCompanyId } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { approvalStatus } from "@/lib/approvals";
import { deleteHourLog, getEmployee, getHourLog, listHourLogs, upsertHourLog } from "@/lib/db";
import { hoursFromTimes } from "@/lib/format";
import type { ApprovalStatus, HourLog } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const employeeId = ownEmployeeId(auth.user, searchParams.get("employeeId"));
  if (auth.user.role === "user" && !employeeId) {
    return NextResponse.json({ error: "No staff record is linked to this login." }, { status: 403 });
  }
  if (auth.user.role === "admin") {
    return NextResponse.json({ error: "You do not have access." }, { status: 403 });
  }
  return NextResponse.json(await listHourLogs(employeeId || undefined, scopedCompanyId(auth.user)));
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<HourLog>;
  const employeeId = ownEmployeeId(auth.user, body.employeeId);
  if (!employeeId || !await canAccessEmployee(auth.user, employeeId)) {
    return NextResponse.json({ error: "You cannot record hours for this person." }, { status: 403 });
  }
  if (!(await getEmployee(employeeId))) {
    return NextResponse.json({ error: "Staff record not found." }, { status: 404 });
  }
  const timed = hoursFromTimes(body.startTime, body.endTime);
  const hours = timed ?? (Number(body.hours) || 0);
  const overtimeHours = Number(body.overtimeHours) || 0;
  if (body.startTime && body.endTime && timed === 0) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
  }
  if (hours <= 0 && overtimeHours <= 0) {
    return NextResponse.json({ error: "Enter the hours you worked." }, { status: 400 });
  }
  if (!body.date) {
    return NextResponse.json({ error: "Choose the date you worked." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const approved = auth.user.role === "agent";
  const log: HourLog = {
    id: `hr_${crypto.randomUUID()}`,
    employeeId,
    date: body.date,
    startTime: body.startTime?.trim() || "",
    endTime: body.endTime?.trim() || "",
    hours,
    overtimeHours,
    notes: body.notes?.trim() || "",
    createdAt: now,
    updatedAt: now,
    status: approved ? "approved" : "pending",
    reviewNote: "",
    reviewedAt: approved ? now : "",
    reviewedBy: approved ? auth.user.id : "",
  };
  const saved = await upsertHourLog(log);
  revalidatePath("/", "layout");
  return NextResponse.json(saved, { status: 201 });
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const body = (await request.json()) as Partial<HourLog> & { status?: ApprovalStatus };
  if (!body.id) return NextResponse.json({ error: "Missing hour record." }, { status: 400 });
  const existing = await getHourLog(body.id);
  if (!existing) return NextResponse.json({ error: "Hour record not found." }, { status: 404 });
  if (!await canAccessEmployee(auth.user, existing.employeeId)) {
    return NextResponse.json({ error: "You cannot change this record." }, { status: 403 });
  }
  if (auth.user.role === "user") {
    if (existing.status === "approved") {
      return NextResponse.json({ error: "Approved hours cannot be changed." }, { status: 403 });
    }
    const saved = await upsertHourLog({
      ...existing,
      date: body.date || existing.date,
      hours: Number(body.hours ?? existing.hours),
      overtimeHours: Number(body.overtimeHours ?? existing.overtimeHours),
      notes: body.notes ?? existing.notes,
      status: "pending",
      updatedAt: new Date().toISOString(),
    });
    revalidatePath("/", "layout");
    return NextResponse.json(saved);
  }
  const nextStatus = body.status ? approvalStatus(body.status, existing.status || "pending") : existing.status || "pending";
  const now = new Date().toISOString();
  const saved = await upsertHourLog({
    ...existing,
    ...body,
    id: existing.id,
    employeeId: existing.employeeId,
    hours: Number(body.hours ?? existing.hours),
    overtimeHours: Number(body.overtimeHours ?? existing.overtimeHours),
    status: nextStatus,
    reviewNote: body.reviewNote ?? existing.reviewNote ?? "",
    reviewedAt: body.status ? now : existing.reviewedAt || "",
    reviewedBy: body.status ? auth.user.id : existing.reviewedBy || "",
    updatedAt: now,
  });
  revalidatePath("/", "layout");
  return NextResponse.json(saved);
}

export async function DELETE(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const existing = id ? await getHourLog(id) : undefined;
  if (!existing) return NextResponse.json({ error: "Hour record not found." }, { status: 404 });
  if (!await canAccessEmployee(auth.user, existing.employeeId)) {
    return NextResponse.json({ error: "You cannot delete this record." }, { status: 403 });
  }
  if (auth.user.role === "user" && existing.status === "approved") {
    return NextResponse.json({ error: "Approved hours cannot be deleted." }, { status: 403 });
  }
  await deleteHourLog(existing.id);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
