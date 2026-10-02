# 개인정보 처리시스템 점검 자료 취합 사이트

개인정보 처리시스템별 안전성 확보조치 이행 현황과 증적자료를 취합·검토하는 웹 사이트입니다.

- 요구사항: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)
- 설계: [docs/DESIGN.md](docs/DESIGN.md)

## 업무 흐름

1. **관리자**가 점검 항목과 대상 시스템을 등록합니다.
2. 회차를 만들고 대상 시스템을 선택한 뒤 **진행 시작**합니다.
3. 시스템별 **제출 링크**를 복사해 담당자에게 전달합니다.
4. **담당자**는 링크로 접속해 이행여부·비고·증적파일을 작성하고 제출합니다.
5. 관리자가 검토 후 **검토완료** 또는 **보완요청**합니다. 보완요청 시 담당자가 수정 후 재제출합니다.
6. 결과를 **CSV로 내보내** 보고서에 활용합니다.

## 실행 방법

```bash
npm install
cp .env.example .env          # SESSION_SECRET 등 값 수정
npx prisma migrate deploy     # DB 생성
npm run db:seed               # 기본 점검 항목 + 관리자 계정 생성
npm run dev                   # http://localhost:3000/admin
```

기본 관리자 계정은 `.env`의 `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` 입니다.

## 명령어

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build && npm start` | 운영 빌드·실행 |
| `npm test` | 단위 테스트 (제출 검증, 이행률, CSV) |
| `npm run lint` / `npm run typecheck` | 린트 / 타입 검사 |
| `npm run db:migrate` | 스키마 변경 시 마이그레이션 생성 |
| `npm run db:studio` | DB 조회 도구 |

## 기술 스택

Next.js 16 (App Router, Server Actions) · React 19 · Prisma 5 + SQLite · Tailwind CSS 4
