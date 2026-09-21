import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireUser, setSessionCookie, toSessionUser } from "@/lib/auth";
import { getUser, upsertUser } from "@/lib/db";
import { putObject, readObject, removeObject } from "@/lib/storage";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = await getUser(auth.user.id);
  if (!user?.avatar) return NextResponse.json({ error: "No photo." }, { status: 404 });
  const file = await readObject(user.avatar, "avatars");
  if (!file) return NextResponse.json({ error: "No photo." }, { status: 404 });
  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.type,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = await getUser(auth.user.id);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const form = await request.formData();
  const upload = form.get("photo");
  if (!(upload instanceof File) || upload.size === 0) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }
  if (upload.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Photos must be 2MB or smaller." }, { status: 400 });
  }
  const ext = TYPES[upload.type];
  if (!ext) return NextResponse.json({ error: "Use a JPG, PNG or WebP image." }, { status: 400 });
  await removeObject(user.avatar);
  const stored = `avatar_${user.id}${ext}`;
  user.avatar = await putObject("avatars", stored, Buffer.from(await upload.arrayBuffer()), upload.type);
  await upsertUser(user);
  revalidatePath("/", "layout");
  const response = NextResponse.json({ avatar: user.avatar });
  await setSessionCookie(response, toSessionUser(user));
  return response;
}

export async function DELETE() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = await getUser(auth.user.id);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  await removeObject(user.avatar);
  user.avatar = "";
  await upsertUser(user);
  revalidatePath("/", "layout");
  const response = NextResponse.json({ ok: true });
  await setSessionCookie(response, toSessionUser(user));
  return response;
}
