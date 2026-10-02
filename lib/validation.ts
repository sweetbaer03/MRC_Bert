import type { ResponseType } from "@/lib/constants";

export type ItemForCheck = {
  id: string;
  code: string | null;
  title: string;
  responseType: string;
  required: boolean;
};

export type ResponseForCheck = {
  status: string | null;
  note: string | null;
  attachmentCount: number;
};

/** 증적파일이 필요한 이행여부 (미이행·해당없음은 증적 없이 제출 가능) */
const EVIDENCE_REQUIRED_STATUSES = ["COMPLIANT", "PARTIAL"];

/**
 * 제출 가능 여부를 검사하고, 누락된 항목별 사유를 돌려줍니다. (FR-33)
 * 빈 배열이면 제출 가능합니다.
 */
export function findMissingItems(
  items: ItemForCheck[],
  responses: Map<string, ResponseForCheck>,
): { item: ItemForCheck; reason: string }[] {
  const missing: { item: ItemForCheck; reason: string }[] = [];
  for (const item of items) {
    const r = responses.get(item.id) ?? { status: null, note: null, attachmentCount: 0 };
    const reason = missingReason(item.responseType as ResponseType, item.required, r);
    if (reason) missing.push({ item, reason });
  }
  return missing;
}

function missingReason(type: ResponseType, required: boolean, r: ResponseForCheck): string | null {
  const hasNote = !!r.note?.trim();
  switch (type) {
    case "STATUS":
      return required && !r.status ? "이행여부를 선택해주세요." : null;
    case "STATUS_FILE":
      if (!r.status) return required ? "이행여부를 선택해주세요." : null;
      if (EVIDENCE_REQUIRED_STATUSES.includes(r.status) && r.attachmentCount === 0) {
        return "이행·부분이행은 증적파일을 첨부해주세요.";
      }
      return null;
    case "TEXT":
      return required && !hasNote ? "내용을 입력해주세요." : null;
    case "FILE":
      return required && r.attachmentCount === 0 ? "파일을 첨부해주세요." : null;
    default:
      return null;
  }
}

/** 이행률: (이행 + 부분이행×0.5) / (해당없음 제외 응답 수). 응답이 없으면 null */
export function complianceRate(statuses: (string | null)[]): number | null {
  let score = 0;
  let total = 0;
  for (const s of statuses) {
    if (!s || s === "NOT_APPLICABLE") continue;
    total += 1;
    if (s === "COMPLIANT") score += 1;
    else if (s === "PARTIAL") score += 0.5;
  }
  return total === 0 ? null : score / total;
}
