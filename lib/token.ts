import { randomBytes } from "crypto";

/** 제출 링크용 256비트 난수 토큰 */
export function generateSubmitToken() {
  return randomBytes(32).toString("base64url");
}
