import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canAccessEmployee, ownEmployeeId, scopedCompanyId } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { addFileRecord, getEmployee, listFiles } from "@/lib/db";
import { putObject } from "@/lib/storage";
import type { FileCategory, RecordFile } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const employeeId = ownEmployeeId(auth.user, searchParams.get("employeeId"));
  if (auth.user.role === "admin") {
    return NextResponse.json({ error: "You do not have access." }, { status: 403 });
  }
  return NextResponse.json(await listFiles(employeeId || undefined, scopedCompanyId(auth.user)));
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const form = await request.formData();
  const employeeId = ownEmployeeId(auth.user, String(form.get("employeeId") || ""));
  if (!employeeId || !await canAccessEmployee(auth.user, employeeId)) {
    return NextResponse.json({ error: "You cannot add files for this person." }, { status: 403 });
  }
  if (!(await getEmployee(employeeId))) {
    return NextResponse.json({ error: "Staff record not found." }, { status: 404 });
  }
  const upload = form.get("file");
  if (!(upload instanceof File) || upload.size === 0) {
    return NextResponse.json({ error: "Choose a file to keep on this record." }, { status: 400 });
  }
  if (upload.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Files must be 10MB or smaller." }, { status: 400 });
  }
  const mimeType = upload.type || "application/octet-stream";
  if (!ALLOWED.has(mimeType)) {
    return NextResponse.json({ error: "Use a PDF, image, spreadsheet or document file." }, { status: 400 });
  }
  const id = `file_${crypto.randomUUID()}`;
  const safe = upload.name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "record";
  const storedName = await putObject("files", `${id}_${safe}`, Buffer.from(await upload.arrayBuffer()), mimeType);
  const record: RecordFile = {
    id,
    employeeId,
    originalName: upload.name,
    storedName,
    mimeType,
    size: upload.size,
    category: ((form.get("category") as FileCategory) || "timesheet") as FileCategory,
    notes: String(form.get("notes") || "").trim(),
    uploadedAt: new Date().toISOString(),
  };
  const saved = await addFileRecord(record);
  revalidatePath("/", "layout");
  return NextResponse.json(saved, { status: 201 });
}
