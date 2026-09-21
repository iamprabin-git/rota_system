import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCompany, saveCompany } from "@/lib/db";
import { putObject, readObject, removeObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

async function companyFor(user: { role: string; companyId: string | null }, requested?: string | null) {
  const companyId = user.role === "admin" ? requested || "" : user.companyId;
  if (!companyId) return undefined;
  if (user.role !== "admin" && requested && requested !== user.companyId) return undefined;
  return getCompany(companyId);
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const company = await companyFor(auth.user, searchParams.get("companyId"));
  if (!company?.logo) return NextResponse.json({ error: "No logo." }, { status: 404 });
  const file = await readObject(company.logo, "avatars");
  if (!file) return NextResponse.json({ error: "No logo." }, { status: 404 });
  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireUser("agent", "admin");
  if (auth.error) return auth.error;
  const form = await request.formData();
  const requested = typeof form.get("companyId") === "string" ? String(form.get("companyId")) : auth.user.companyId;
  const company = await companyFor(auth.user, requested);
  if (!company) return NextResponse.json({ error: "No company is linked to this account." }, { status: 404 });
  const upload = form.get("logo");
  if (!(upload instanceof File) || upload.size === 0) {
    return NextResponse.json({ error: "Choose a logo to upload." }, { status: 400 });
  }
  if (upload.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Logos must be 2MB or smaller." }, { status: 400 });
  }
  const ext = TYPES[upload.type];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });
  await removeObject(company.logo);
  const stored = `logo_${company.id}${ext}`;
  company.logo = await putObject("avatars", stored, Buffer.from(await upload.arrayBuffer()), upload.type);
  await saveCompany(company);
  revalidatePath("/", "layout");
  revalidatePath("/agent/payslips");
  revalidatePath("/agent/payslips/print");
  return NextResponse.json({ logo: company.logo });
}

export async function DELETE(request: Request) {
  const auth = await requireUser("agent", "admin");
  if (auth.error) return auth.error;
  const { searchParams } = new URL(request.url);
  const company = await companyFor(auth.user, searchParams.get("companyId") || auth.user.companyId);
  if (!company) return NextResponse.json({ error: "No company is linked to this account." }, { status: 404 });
  await removeObject(company.logo);
  company.logo = "";
  await saveCompany(company);
  revalidatePath("/", "layout");
  revalidatePath("/agent/payslips");
  revalidatePath("/agent/payslips/print");
  return NextResponse.json({ ok: true });
}
