# Chatmore System — AI 기반 대학 생활정보 챗봇 시스템 UI

> **흩어진 대학 정보를 하나의 대화로.**

순천대학교 학생이 학사, 장학금, 비교과 프로그램, 교내 시설과 생활정보를
자연어 질문으로 확인하는 **AI 챗봇 시스템의 학생용 UI + 관리자 시스템**
전체 프로젝트입니다. 

---

## ⚡ 빠른 시작 (Quick Start)

Node.js **20 이상**만 있으면 됩니다. C++ 빌드 도구는 필요 없습니다.

**Windows PowerShell**
```powershell
cd chatmore-system
npm install
Copy-Item .env.example .env
npm run db:setup      # 실패 시: npm run db:init-offline
npm run dev           # http://localhost:3000
```

**macOS / Linux**
```bash
cd chatmore-system
npm install
cp .env.example .env
npm run db:setup      # 실패 시: npm run db:init-offline
npm run dev           # http://localhost:3000
```

### 데모 계정

| 구분 | 이메일 | 비밀번호 |
|---|---|---|
| 재학생 (김순천) | `student@demo.chatmore.kr` | `chatmore-demo` |
| 신입생 · **온보딩 체험용** | `freshman@demo.chatmore.kr` | `chatmore-demo` |
| 대학원생 | `grad@demo.chatmore.kr` | `chatmore-demo` |
| 외국인 유학생 | `global@demo.chatmore.kr` | `chatmore-demo` |
| **관리자** (`/admin/login`) | `admin@chatmore.kr` | `chatmore1234!` |

로그인 화면의 데모 계정 버튼을 누르면 자동으로 입력됩니다.
시범 운영 단계라 회원가입은 제한되며(화면에 안내), 학교 계정 연동은 "연동 예정"으로 표시됩니다.

---

## 1. 프로젝트 개요

### 핵심 사용자
재학생 · 신입생 · 대학원생 · 복학생 · 외국인 유학생 · 교직원(관리자)

### 학생용 화면

| 라우트 | 화면 |
|---|---|
| `/login` `/signup` | 로그인(데모 계정) · 회원가입(시범 단계 안내) |
| `/onboarding` | 4단계 온보딩 (유형 → 기본 정보 → 관심 분야 → 알림) |
| `/home` | 홈 대시보드 (빠른 질문·맞춤 추천·일정·공지·최근 대화) |
| `/chat` `/chat/[id]` | AI 챗봇 (대화 저장, 출처 패널, 관련 공지, 후속 질문, 평가·신고, 모바일 바텀시트) |
| `/explore` `/explore/[category]` | 정보 탐색 (카테고리·검색·필터·정렬·마감 임박) |
| `/notice` `/notice/[id]` | 공지 목록·상세 (+ "이 공지에 대해 질문하기") |
| `/calendar` | 월간 달력 + 일정 목록 + 개인 일정 추가 |
| `/notifications` | 알림함 (읽음 처리) |
| `/history` | 대화 기록 (검색·즐겨찾기·제목 변경·삭제) |
| `/bookmarks` | 즐겨찾기 (답변/공지/일정/질문 구분) |
| `/feedback` | 오류 신고·문의 + 내 신고 내역 |
| `/settings` | 프로필·챗봇 설정·접근성(글자 크기/고대비/모션)·개인정보(데이터 다운로드/기록 삭제/탈퇴) |

### 관리자 화면 (`/admin`)

대시보드(통계·차트) · **대학 정보 데이터 관리(RAG 소스 CRUD + AI 검색 포함 설정)** ·
공지 관리 · 질문 분석 · 답변 품질 관리(부정 평가 워크플로) · 사용자 피드백 ·
오류 신고 처리 · 카테고리 · 사용자 관리 · 통계 · 시스템 설정(연동 상태·활동 로그)

### 실제로 동작하는 것

- **Mock RAG 파이프라인**: 관리자가 등록한 「대학 정보 데이터」를 키워드
  스코어링으로 검색해 답변·출처·관련 공지·후속 질문을 생성합니다.
  관리자에서 데이터를 추가하면 **즉시 챗봇 답변에 반영**됩니다 (E2E 검증 완료).
- 대화·평가·신고·북마크·알림·설정이 모두 SQLite DB에 저장됩니다.
- 민감정보(주민번호·전화번호·이메일 패턴)는 저장 전 자동 마스킹됩니다.
- 접근성 설정(글자 크기·고대비·모션 감소)이 실제 화면에 적용됩니다.

> ⚠️ 챗봇의 모든 답변은 **데모 응답**이며 UI에 명시 표시됩니다. 실제
> GPT/RAG 서버 연동 방법은 [11장](#11-실제-airag-서버-연동-가이드)을 참고하세요.

## 2. 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 (App Router) + TypeScript + React 18 |
| 스타일 | Tailwind CSS + CSS Variables 디자인 토큰 (DESIGNcoinbase.md 재해석) |
| 상태 관리 | 서버 상태: Server Components / UI 상태: React state (경량 데모 구성) |
| DB | Prisma 7 (Rust-free) + SQLite (libSQL 드라이버 — 빌드 도구 불필요) |
| 인증 | HMAC 서명 세션 쿠키 (사용자/관리자 분리) + bcryptjs |
| AI 레이어 | `lib/ai/` 서비스 레이어 (Mock ↔ 실제 API 교체 가능) |
| 테스트 | Vitest(단위 8개) + Playwright E2E 스모크(14개 체크) |

## 3. 폴더 구조

```text
chatmore-system/
├── app/
│   ├── login/ signup/ onboarding/ privacy/ terms/
│   ├── (user)/            # 학생 화면 (사이드바 셸)
│   │   ├── home/ chat/ chat/[conversationId]/
│   │   ├── explore/ explore/[category]/
│   │   ├── notice/ notice/[id]/ calendar/ notifications/
│   │   ├── history/ bookmarks/ feedback/ settings/
│   ├── admin/
│   │   ├── login/
│   │   └── (dashboard)/   # data/ notices/ questions/ answers/
│   │                      # feedback/ reports/ users/ categories/
│   │                      # analytics/ settings/
│   └── api/my-data/       # 내 데이터 다운로드
├── components/
│   ├── chat/ (ChatScreen, QuickAsk, ConversationRow)
│   ├── navigation/ (UserShell, LoginForm, OnboardingWizard ...)
│   ├── admin/ calendar/ feedback/ notice/ ui/
├── lib/
│   ├── ai/          # chat-service, rag-service, source-service, feedback-service
│   ├── actions/     # Server Actions (auth / chat / user / admin)
│   ├── auth/        # 세션, 가드, Rate Limit
│   ├── database/ generated/ validation/ utils/
├── types/chat.ts    # ChatRequest / ChatResponse / SourceItem 규격
├── prisma/          # schema.prisma, seed.ts
├── scripts/init-db.ts  # 오프라인 DB 초기화 대체 스크립트
├── tests/           # Vitest + e2e-smoke.mjs
└── styles/ public/ middleware.ts
```

## 4. 환경변수 설정

`.env.example` → `.env` 복사 후 수정:

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | SQLite 경로 (기본 `file:./dev.db`, prisma/ 기준) |
| `SESSION_SECRET` | 세션 서명 키 — **32자 이상 무작위 문자열로 교체 필수** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | 시드로 생성되는 관리자 계정 |
| `DEMO_USER_PASSWORD` | 데모 학생 계정 공통 비밀번호 |
| `CHATBOT_API_URL` / `CHATBOT_API_KEY` | (선택) 실제 AI/RAG API — 비우면 Mock |

## 5. 데이터베이스 설정

```bash
npm run db:setup        # generate + push + seed
# 네트워크 제한으로 Prisma 엔진 다운로드가 실패하면:
npm run db:init-offline # 동일한 테이블을 직접 생성 + seed
```

시드 데이터: 데모 계정 5개(관리자 포함), 대학 정보 데이터 15건(RAG 소스),
공지 8건, 일정 11건, 카테고리 12개, 데모 알림 3건.
**모든 시드 데이터는 데모 예시이며 실제 대학 공지가 아닙니다.**

DB 초기화: `prisma/dev.db` 삭제 후 `npm run db:setup` 재실행.

## 6. 사용자 인증 설정

- 세션: HMAC-SHA256 서명 httpOnly 쿠키. 사용자(7일)와 관리자(8시간/30일)
  쿠키가 분리되어 있고, 미들웨어 + 서버 가드(`lib/auth/guards.ts`) 이중 보호.
- 시범 운영 단계라 **회원가입은 비활성**(정직하게 안내)이며 데모 계정으로
  로그인합니다. 실제 가입을 열려면 `lib/actions/auth.ts` 의 `signupAttempt` 를
  사용자 생성 로직으로 교체하세요.

## 7. 관리자 계정 생성

`.env` 의 `ADMIN_EMAIL`/`ADMIN_PASSWORD` 를 수정한 뒤 `npm run db:seed` 를 다시
실행하면 새 관리자 계정이 생성됩니다(기존 이메일은 유지 — upsert).
운영 전 기본 비밀번호를 반드시 변경하세요.

## 8. 개발 서버 실행

```bash
npm run dev    # http://localhost:3000
```
- 학생: `/login` → 데모 계정 로그인
- 관리자: `/admin/login`

## 9. Mock API 사용 방법

`CHATBOT_API_URL` 이 비어 있으면 자동으로 Mock 서비스가 동작합니다.

- 흐름: 질문 → `lib/ai/rag-service.ts` 가 관리자 등록 데이터(활성 + AI 검색
  포함)를 키워드 스코어링 검색 → `lib/ai/chat-service.ts` 가 템플릿 답변 +
  출처 + 관련 공지 + 후속 질문 생성 → `isDemo: true` 로 UI에 데모 표시
- **관리자 → 대학 정보 데이터**에서 새 데이터를 등록하면 챗봇이 바로
  검색합니다. 데모 시연 시 이 흐름을 보여주면 RAG 구조가 그대로 전달됩니다.

## 10. 테스트 실행

```bash
npm test               # Vitest 단위 테스트 (세션·Rate Limit·RAG·Mock 서비스)
```

E2E 스모크 (빌드된 서버 필요):
```bash
npm run build && PORT=3200 npm run start &
node tests/e2e-smoke.mjs
# 대상 변경: E2E_BASE_URL=http://localhost:3000 node tests/e2e-smoke.mjs
# Playwright 브라우저가 없으면: npx playwright install chromium
```
시나리오: ①로그인→온보딩→홈 추천 질문→챗봇 답변·출처→평가→대화 기록
②관리자 로그인→데이터 등록→**챗봇 RAG 반영 확인**→부정 평가→상태 변경 (14개 체크)

## 11. 실제 AI·RAG 서버 연동 가이드

UI는 `lib/ai/chat-service.ts` 의 `ChatResponse` 규격만 사용하므로, 외부 AI
서버가 이 규격을 반환하면 **UI 수정 없이** 전환됩니다.

1. `.env` 에 `CHATBOT_API_URL`(필수), `CHATBOT_API_KEY`(선택) 설정
2. 외부 서버는 `POST CHATBOT_API_URL` 로 `ChatRequest` 를 받아 `ChatResponse`
   JSON을 반환 (타입 정의: `types/chat.ts`)

```jsonc
// 요청 (ChatRequest)
{
  "conversationId": "cuid",
  "message": "이번 학기 장학금 알려줘",
  "userContext": { "userType": "재학생", "department": "컴퓨터공학과", "grade": "3학년", "interests": ["장학금"] }
}
// 응답 (ChatResponse)
{
  "conversationId": "cuid", "answerId": "id",
  "answer": "…", "summary": "…",
  "sources": [{ "id": "...", "title": "...", "department": "...", "publishedAt": "...", "sourceUrl": "...", "excerpt": "...", "status": "official" }],
  "relatedNotices": [], "followUpQuestions": ["…"],
  "generatedAt": "ISO8601", "dataCheckedAt": "YYYY-MM-DD",
  "status": "success", "isDemo": false
}
```

RAG 출처 데이터 연동: 서버 측 벡터 DB를 사용할 경우에도 관리자 「대학 정보
데이터」를 원본 저장소로 활용할 수 있습니다 — `InformationSource` 테이블을
임베딩 파이프라인의 소스로 동기화하고, `dataStatus`/`isAiSearchable` 값을
색인 필터로 사용하세요.

## 12. 프로덕션 빌드·배포

```bash
npm run build && npm run start
```

Vercel 등 서버리스 배포 시:
1. SQLite → 호스팅 DB 전환 (Supabase PostgreSQL 권장):
   `schema.prisma` 의 provider 를 `postgresql` 로, 어댑터를
   `@prisma/adapter-pg` 로 교체 (`lib/database/db.ts`, `prisma/seed.ts` 두 곳)
2. 환경변수 등록: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_*`
3. Rate Limit 을 Redis 기반으로 교체 (다중 인스턴스 대응)

## 13. 디자인 MD 적용 방법

`DESIGNcoinbase.md` 의 토큰이 두 곳에 반영되어 있습니다.

1. `styles/globals.css` — `:root` CSS Variables (컬러·라운드·그림자)
2. `tailwind.config.ts` — 변수를 참조하는 Tailwind 토큰

새 디자인 `.md` 적용: ①컬러/타이포/라운드 값 분석 → ②`:root` 변수만 교체 →
③폰트 변경 시 `tailwind.config.ts` + `app/layout.tsx` 수정 → ④반응형
(320/768/1024/1440px)·접근성 대비 검증 → ⑤기존 기능 동작 재확인.
시스템 UI 특성상 카드 8~16px·버튼 8~12px 라운드를 유지했습니다 (마케팅용 pill 지양).

## 14. 개인정보 및 보안 주의사항

- 질문 저장 전 민감정보 패턴(주민번호·전화번호·이메일) 자동 마스킹
- 대화 기록 저장 여부·맞춤 추천 동의를 설정에서 선택 가능, 데이터
  다운로드(JSON)·기록 삭제·탈퇴 제공 (데모 계정은 탈퇴 보호)
- 관리자 화면에는 개인 질문 내용을 최소한으로만 노출 (사용자 관리 화면에는 미노출)
- 세션 쿠키 httpOnly + HMAC 서명, 로그인·질문 Rate Limit, Zod 서버 검증,
  Prisma 파라미터 바인딩(SQL Injection 방지), 관리자 활동 로그 기록
- 비밀번호·API Key 하드코딩 없음 (.env 분리)

## 15. 알려진 제한사항

- **챗봇은 Mock 응답**: 실제 GPT/RAG 미연동이며 화면에 "데모 응답"으로 표시
- **회원가입 비활성**: 데모 계정 전용 (학교 계정 연동은 "연동 예정" 표시)
- **알림 채널**: 서비스 내 알림함만 동작 — 이메일·푸시는 연동 예정으로 표시
- **파일 첨부·음성 입력**: 챗봇 입력창에 미구현 (요구 시 확장 지점:
  `components/chat/ChatScreen.tsx` 입력 영역)
- SQLite·메모리 Rate Limit 은 로컬/단일 서버 전용 ([12장](#12-프로덕션-빌드배포))
- shadcn/ui·React Hook Form·Zustand·Framer Motion 은 경량화를 위해 자체
  컴포넌트·Server Actions·CSS 트랜지션으로 대체

---

© 2026 Chatmore Project. 시드 데이터는 모두 데모 예시이며, 실제 대학 공지·
실적·수치를 포함하지 않습니다.
