"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** 증적파일 업로드. 업로드 후 화면을 새로고침해 목록을 갱신합니다 (작성 중인 입력값은 유지). */
export function FileUploader({ token, roundItemId }: { token: string; roundItemId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("roundItemId", roundItemId);
        body.set("file", file);
        const res = await fetch(`/api/submit/${token}/upload`, { method: "POST", body });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "업로드에 실패했습니다.");
        }
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "업로드에 실패했습니다.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="text-sm">
      <label className={`btn-secondary cursor-pointer ${busy ? "opacity-50" : ""}`}>
        {busy ? "업로드 중..." : "+ 증적파일 첨부"}
        <input ref={inputRef} type="file" multiple className="hidden" disabled={busy}
          onChange={(e) => upload(e.target.files)} />
      </label>
      <span className="ml-2 text-xs text-slate-500">파일당 20MB 이하 · PDF, HWP, Office, 이미지, ZIP</span>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
