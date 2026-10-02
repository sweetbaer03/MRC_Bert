import { redirect } from "next/navigation";

/** Server Action 처리 후 결과 메시지를 쿼리스트링으로 전달하며 이동합니다. */
export function redirectWith(path: string, msg: { ok?: string; error?: string }): never {
  const params = new URLSearchParams();
  if (msg.ok) params.set("ok", msg.ok);
  if (msg.error) params.set("error", msg.error);
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${params.toString()}`);
}

export type FlashParams = Promise<{ ok?: string; error?: string }>;

export function str(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optStr(form: FormData, key: string) {
  return str(form, key) || null;
}

export function optDate(form: FormData, key: string) {
  const v = str(form, key);
  return v ? new Date(`${v}T00:00:00+09:00`) : null;
}
