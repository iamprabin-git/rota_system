import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canAccessEmployee } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { deleteFileRecord, getFileRecord } from "@/lib/db";
import { readObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const file = await getFileRecord(id);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (!await canAccessEmployee(auth.user, file.employeeId)) {
    return NextResponse.json({ error: "You cannot open this file." }, { status: 403 });
  }
  const stored = await readObject(file.storedName, "files");
  if (!stored) return NextResponse.json({ error: "File not found." }, { status: 404 });
  return new NextResponse(new Uint8Array(stored.bytes), {
    headers: {
      "Content-Type": file.mimeType || stored.type,
      "Content-Disposition": `attachment; filename="${file.originalName.replace(/"/g, "")}"`,
    },
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const file = await getFileRecord(id);
  if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (!await canAccessEmployee(auth.user, file.employeeId)) {
    return NextResponse.json({ error: "You cannot delete this file." }, { status: 403 });
  }
  await deleteFileRecord(id);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
