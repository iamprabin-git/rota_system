import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { AVATARS_DIR, DATA_DIR, FILES_DIR } from "./db-file";

export function usingBlob() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function mimeFromName(name: string, fallback: string) {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return fallback;
}

export async function putObject(kind: "files" | "avatars", name: string, bytes: Buffer, contentType: string) {
  if (usingBlob()) {
    const blob = await put(`${kind}/${name}`, bytes, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return blob.url;
  }
  const dir = kind === "avatars" ? AVATARS_DIR : FILES_DIR;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), bytes);
  return name;
}

export async function readObject(ref: string, kind: "files" | "avatars" = "files") {
  if (!ref) return null;
  if (usingBlob() || isUrl(ref)) {
    const result = await get(ref, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
    return { bytes: buffer, type: result.blob.contentType || "application/octet-stream" };
  }
  const name = path.basename(ref);
  const dir = kind === "avatars" || name.startsWith("logo_") ? AVATARS_DIR : FILES_DIR;
  try {
    return {
      bytes: readFileSync(path.join(dir, name)),
      type: mimeFromName(name, kind === "avatars" ? "image/jpeg" : "application/octet-stream"),
    };
  } catch {
    return null;
  }
}

export async function removeObject(ref?: string) {
  if (!ref) return;
  if (usingBlob() || isUrl(ref)) {
    try {
      await del(ref);
    } catch {
      /* ignore missing blob */
    }
    return;
  }
  const name = path.basename(ref);
  const filePath = path.join(
    name.startsWith("avatar_") || name.startsWith("logo_") || ref.includes("avatar") ? AVATARS_DIR : FILES_DIR,
    name,
  );
  try {
    rmSync(filePath, { force: true });
  } catch {
    /* ignore */
  }
}

export function storageDir() {
  mkdirSync(DATA_DIR, { recursive: true });
  return DATA_DIR;
}
