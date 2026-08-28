export const EVIDENCE_TYPES = {
  STATUS: "STATUS", // 이행 여부만 선택
  STATUS_FILE: "STATUS_FILE", // 이행 여부 + 증적파일 첨부
  TEXT: "TEXT", // 서술형 응답
  FILE: "FILE", // 파일 첨부만
} as const;

export type EvidenceType = keyof typeof EVIDENCE_TYPES;

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  STATUS: "이행여부 체크",
  STATUS_FILE: "이행여부 + 증적파일",
  TEXT: "서술형 응답",
  FILE: "파일 첨부",
};

export const RESPONSE_STATUSES = ["이행", "부분이행", "미이행", "해당없음"] as const;
export type ResponseStatus = (typeof RESPONSE_STATUSES)[number];

export const ROUND_STATUSES = {
  DRAFT: "DRAFT",
  OPEN: "OPEN",
  CLOSED: "CLOSED",
} as const;
export type RoundStatus = keyof typeof ROUND_STATUSES;

export const ROUND_STATUS_LABELS: Record<RoundStatus, string> = {
  DRAFT: "준비중",
  OPEN: "진행중",
  CLOSED: "마감",
};

export const ROUND_SYSTEM_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  REVIEWED: "REVIEWED",
} as const;
export type RoundSystemStatus = keyof typeof ROUND_SYSTEM_STATUSES;

export const ROUND_SYSTEM_STATUS_LABELS: Record<RoundSystemStatus, string> = {
  NOT_STARTED: "미시작",
  IN_PROGRESS: "작성중",
  SUBMITTED: "제출완료",
  REVIEWED: "검토완료",
};

export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
