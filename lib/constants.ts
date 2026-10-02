export const RESPONSE_TYPES = ["STATUS", "STATUS_FILE", "TEXT", "FILE"] as const;
export type ResponseType = (typeof RESPONSE_TYPES)[number];

export const RESPONSE_TYPE_LABELS: Record<ResponseType, string> = {
  STATUS: "이행여부",
  STATUS_FILE: "이행여부 + 증적파일",
  TEXT: "서술형",
  FILE: "파일 첨부",
};

export const COMPLIANCE_STATUSES = ["COMPLIANT", "PARTIAL", "NON_COMPLIANT", "NOT_APPLICABLE"] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

export const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  COMPLIANT: "이행",
  PARTIAL: "부분이행",
  NON_COMPLIANT: "미이행",
  NOT_APPLICABLE: "해당없음",
};

export const ROUND_STATUSES = ["DRAFT", "OPEN", "CLOSED"] as const;
export type RoundStatus = (typeof ROUND_STATUSES)[number];

export const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  DRAFT: "준비중",
  OPEN: "진행중",
  CLOSED: "마감",
};

export const ASSIGNMENT_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED", "RETURNED", "APPROVED"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  NOT_STARTED: "미시작",
  IN_PROGRESS: "작성중",
  SUBMITTED: "제출완료",
  RETURNED: "보완요청",
  APPROVED: "검토완료",
};

/** 제출 담당자가 수정할 수 있는 배정 상태 */
export const EDITABLE_ASSIGNMENT_STATUSES: readonly string[] = ["NOT_STARTED", "IN_PROGRESS", "RETURNED"];

export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

export const ALLOWED_UPLOAD_EXTENSIONS = [
  "pdf", "hwp", "hwpx", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "txt",
  "png", "jpg", "jpeg", "gif", "zip",
] as const;

export function label<T extends string>(labels: Record<T, string>, value: string | null | undefined) {
  if (!value) return "-";
  return (labels as Record<string, string>)[value] ?? value;
}
