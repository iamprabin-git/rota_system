import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { canAccessEmployee } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { deleteFileRecord, FILES_DIR, getFileRecord } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const file = getFileRecord(id);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (!canAccessEmployee(auth.user, file.employeeId)) {
    return NextResponse.json({ error: "You cannot open this file." }, { status: 403 });
  }
  const bytes = readFileSync(path.join(FILES_DIR, file.storedName));
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.originalName.replace(/"/g, "")}"`,
    },
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const file = getFileRecord(id);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (!canAccessEmployee(auth.user, file.employeeId)) {
    return NextResponse.json({ error: "You cannot delete this file." }, { status: 403 });
  }
  deleteFileRecord(id);
  return NextResponse.json({ ok: true });
}
