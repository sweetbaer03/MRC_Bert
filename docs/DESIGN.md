# 개인정보 처리시스템 점검 자료 취합 사이트 — 설계서 (v2)

요구사항은 [REQUIREMENTS.md](./REQUIREMENTS.md) 참고. FR 번호는 요구사항 정의서와 대응합니다.

## 1. 아키텍처

```
[브라우저: 관리자]  ── 세션 쿠키(JWT, 8h) ──┐
                                             ├─ Next.js 16 (App Router)
[브라우저: 제출 담당자] ── 회차 전용 링크 ───┘     ├─ Server Components: 화면 렌더링
                                                   ├─ Server Actions: 저장·상태 변경
                                                   ├─ Route Handlers: 파일 업/다운로드, CSV
                                                   ├─ Prisma ── SQLite (→ PostgreSQL 전환 가능)
                                                   └─ 로컬 디스크 UPLOAD_DIR (웹 루트 밖)
```

- 단일 Next.js 앱. 별도 API 서버 없이 Server Action으로 폼 처리 → 코드량과 보안 표면 최소화.
- 모든 Server Action / Route Handler에서 **직접 권한을 검사**합니다 (레이아웃 검사에 의존하지 않음).

## 2. v1 대비 주요 설계 변경

| 항목 | v1 | v2 | 이유 |
|---|---|---|---|
| 제출 링크 | 시스템별 영구 토큰(cuid) | **회차×시스템별** 256비트 난수 토큰, 재발급 가능 | 링크 유출 시 영향 범위를 한 회차로 제한, 추측 불가 |
| 검토 흐름 | 제출 → 검토완료 | 제출 → **보완요청 ↔ 재제출** → 검토완료, 항목별 의견 | 실제 점검 업무의 보완 절차 반영 |
| 감사 로그 | 없음 | 로그인·제출·검토·파일·내보내기 기록 | 개인정보 관련 업무 특성상 추적성 필요 |
| 결과 활용 | 없음 | CSV 내보내기, 제출률·이행률 집계 | 보고서 작성 지원 |
| 영역 관리 | 항목만 비활성화 | 영역도 비활성화 | 평가 기준 개편 대응 |

## 3. 데이터 모델 (`prisma/schema.prisma`)

```
Category 1─* Item                 (원본 체크리스트)
Round 1─* RoundItem               (회차 생성 시 Item 스냅샷, FR-04)
Round 1─* Assignment *─1 System   (회차×시스템 배정, token·상태 보유)
Assignment 1─* Response *─1 RoundItem   (항목별 응답, @@unique)
Response 1─* Attachment           (증적파일 메타데이터)
AuditLog                          (감사 로그)
```

### 상태 전이

**Round**: `DRAFT → OPEN ⇄ CLOSED`

**Assignment**
```
NOT_STARTED ─(첫 저장/업로드)→ IN_PROGRESS ─(제출)→ SUBMITTED ─(검토완료)→ APPROVED
                                                    │
                                                    └(보완요청)→ RETURNED ─(재제출)→ SUBMITTED
```
- 제출 담당자 수정 가능 조건: `Round=OPEN` AND `Assignment ∈ {NOT_STARTED, IN_PROGRESS, RETURNED}`
- 검토 결정 가능 조건: `Assignment ∈ {SUBMITTED, APPROVED}` (검토완료 후 보완요청으로 되돌리기 허용)

### 제출 검증 규칙 (`lib/validation.ts`)
| 응답 유형 | 필수일 때 | 비고 |
|---|---|---|
| STATUS | 이행여부 선택 | |
| STATUS_FILE | 이행여부 선택 | 이행·부분이행이면 **선택 항목이라도** 증적 1개 이상 |
| TEXT | 공백 아닌 내용 | |
| FILE | 첨부 1개 이상 | |

이행률 = (이행 + 부분이행×0.5) / (해당없음·미응답 제외 응답 수)

## 4. 화면 구성

| 경로 | 사용자 | 기능 |
|---|---|---|
| `/admin/login` | 관리자 | 로그인 |
| `/admin` | 관리자 | 대시보드: 진행중 회차 현황, 검토 대기 건수 (FR-51) |
| `/admin/checklist` | 관리자 | 점검 영역·항목 관리 (FR-01~03) |
| `/admin/systems` | 관리자 | 대상 시스템 관리 (FR-10) |
| `/admin/rounds`, `/new` | 관리자 | 회차 목록·생성 (FR-20) |
| `/admin/rounds/[id]` | 관리자 | 상태 변경, 제출 현황, 링크 복사·재발급, 대상 추가·제외 (FR-21~24) |
| `/admin/rounds/[id]/review/[aid]` | 관리자 | 응답·증적 열람, 의견, 검토완료/보완요청 (FR-40~42) |
| `/admin/rounds/[id]/export` | 관리자 | CSV 다운로드 (FR-50) |
| `/admin/audit` | 관리자 | 감사 로그 검색 (FR-61) |
| `/submit/[token]` | 제출 담당자 | 작성·임시저장·제출, 검토 의견 확인 (FR-30~36) |
| `/api/submit/[token]/upload` | 제출 담당자 | 증적 업로드 |
| `/api/submit/[token]/files/[id]`, `/api/files/[id]` | 제출자 / 관리자 | 증적 다운로드 |

제출 화면은 하나의 폼에서 모든 버튼(임시저장·제출·첨부 삭제)이 **입력값을 먼저 저장**한 뒤 동작하므로 작성 중 내용이 유실되지 않습니다.

## 5. 보안 설계

- 관리자 비밀번호 bcrypt, 세션 JWT(HS256, `SESSION_SECRET` 32자 이상 강제), HttpOnly·SameSite=Lax 쿠키.
- 로그인 실패 시 계정 존재 여부를 드러내지 않는 동일 메시지 + 지연, 실패 기록.
- 제출 토큰: `crypto.randomBytes(32)` base64url. 형식 검사 후 조회. `Referrer-Policy: no-referrer`로 토큰 URL 유출 방지.
- 파일: 확장자 화이트리스트, 20MB 제한, 서버 생성 난수 파일명(경로 조작 차단), 다운로드는 항상
  `application/octet-stream` + `attachment` + `nosniff`. 제출자는 자신의 배정 파일만 접근.
- CSV: 수식 주입(`= + - @`) 방지 이스케이프.
- `X-Frame-Options: DENY`, 검색엔진 색인 차단.

## 6. 확장 포인트
- PostgreSQL 전환: `datasource.provider` 변경 후 마이그레이션 재생성.
- 파일 저장소 교체: `lib/storage.ts`의 save/read/delete만 교체 (S3, NAS 등).
- 이메일 발송: 회차 상세의 링크 복사 지점에 메일 발송 액션 추가.
- 권한 세분화: `AdminUser.role` 추가 후 `requireAdmin`에서 역할 검사.
