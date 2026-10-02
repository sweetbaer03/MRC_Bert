import "server-only";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";

function uploadRoot() {
  return path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.UPLOAD_DIR ?? "./storage/uploads");
}

/** storedName은 서버가 만든 난수 이름만 허용해 경로 조작을 막습니다. */
function resolveStored(storedName: string) {
  if (!/^[A-Za-z0-9_-]+(\.[a-z0-9]+)?$/.test(storedName)) {
    throw new Error("잘못된 파일 식별자입니다.");
  }
  return path.join(uploadRoot(), storedName);
}

export function validateUpload(file: File): string | null {
  if (file.size === 0) return "빈 파일은 업로드할 수 없습니다.";
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `파일 크기는 ${MAX_UPLOAD_SIZE_BYTES / 1024 / 1024}MB 이하여야 합니다.`;
  }
  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!(ALLOWED_UPLOAD_EXTENSIONS as readonly string[]).includes(ext)) {
    return `허용되지 않는 파일 형식입니다. (허용: ${ALLOWED_UPLOAD_EXTENSIONS.join(", ")})`;
  }
  return null;
}

export async function saveUpload(file: File) {
  const ext = path.extname(file.name).slice(1).toLowerCase();
  const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
  await mkdir(uploadRoot(), { recursive: true });
  await writeFile(resolveStored(storedName), Buffer.from(await file.arrayBuffer()));
  return storedName;
}

export function readUpload(storedName: string) {
  return readFile(resolveStored(storedName));
}

export async function deleteUpload(storedName: string) {
  await unlink(resolveStored(storedName)).catch(() => undefined);
}
