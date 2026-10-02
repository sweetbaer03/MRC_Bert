import "server-only";
import { readUpload } from "@/lib/storage";

/** 증적파일 다운로드 응답. 브라우저에서 실행되지 않도록 항상 첨부파일로 내려보냅니다. */
export async function fileResponse(att: { filename: string; storedName: string; mimeType: string }) {
  const data = await readUpload(att.storedName).catch(() => null);
  if (!data) return new Response("파일을 찾을 수 없습니다.", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(att.filename)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
