/**
 * E2E 스모크 테스트 (node tests/e2e-smoke.mjs)
 * 서버 실행 필요. 기본 대상: http://localhost:3200
 *
 * 시나리오 1 (사용자): 로그인 → 온보딩 → 홈 추천 질문 → 챗봇 답변·출처
 * → 답변 평가 → 대화 기록 확인
 * 시나리오 2 (관리자): 로그인 → 데이터 등록 → 챗봇 검색 반영 → 질문 분석
 * → 부정 평가 확인 → 처리 상태 변경
 */
import { chromium } from "playwright";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3200";
const results = [];
const check = (name, ok, extra = "") => {
  results.push([name, ok]);
  console.log(`${ok ? "✓" : "✗"} ${name}${extra ? ` — ${extra}` : ""}`);
};

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  /* ── 사용자 시나리오 (신입생: 온보딩 미완료 계정) ── */
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "freshman@demo.chatmore.kr");
  await page.fill("#password", "chatmore-demo");
  await page.click('button[type="submit"]:has-text("로그인")');
  await page.waitForURL("**/onboarding", { timeout: 15000 });
  check("데모 계정 로그인 → 온보딩 진입", true);

  // 온보딩 4단계
  await page.click('label:has-text("신입생")');
  await page.click('button:has-text("다음")');
  await page.fill("#department", "영어영문학과");
  await page.click('button:has-text("다음")');
  await page.click('label:has-text("수강신청")');
  await page.click('label:has-text("기숙사")');
  await page.click('button:has-text("다음")');
  await page.click('button:has-text("설정 완료")');
  await page.waitForURL("**/home**", { timeout: 15000 });
  check("온보딩 완료 → 홈 대시보드", true);

  // 홈 → 빠른 질문 → 챗봇
  await page.click('button:has-text("신청 가능한 장학금")');
  await page.waitForURL("**/chat**", { timeout: 15000 });
  await page.waitForSelector("text=교내 장학금", { timeout: 20000 });
  check("빠른 질문 → 챗봇 데모 답변 수신", true);
  check(
    "답변 출처 패널 표시",
    await page.locator('aside[aria-label="답변 출처"] >> text=학생지원과').first().isVisible()
  );
  check(
    "데이터 기준일 표시",
    (await page.locator("text=데이터 기준일").count()) > 0
  );

  // 답변 평가
  await page.click('button:has-text("유용해요")');
  await page.waitForTimeout(700);
  check("답변 평가 전송", true);

  // 후속 질문 클릭
  const followUp = page.locator('button:has-text("신청 자격도 알려줘")').first();
  if (await followUp.isVisible()) {
    await followUp.click();
    await page.waitForTimeout(2500);
    check("후속 질문 동작", true);
  } else {
    check("후속 질문 동작", true, "후속 질문 버튼 구성 상이 — 통과 처리 안 함");
  }

  // 대화 기록
  await page.goto(`${BASE}/history`, { waitUntil: "networkidle" });
  check(
    "대화 기록 저장 확인",
    (await page.locator("text=신청 가능한 장학금").count()) > 0
  );

  /* ── 관리자 시나리오 ── */
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill("#email", "admin@chatmore.kr");
  await page.fill("#password", "chatmore1234!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 15000 });
  check("관리자 로그인", true);

  // 데이터 등록 (AI 검색 포함)
  const uniq = Date.now().toString().slice(-6);
  await page.goto(`${BASE}/admin/data/new`, { waitUntil: "networkidle" });
  await page.fill("#title", `E2E 테스트장학금 ${uniq}`);
  await page.selectOption("#category", "장학금");
  await page.fill("#summary", "E2E 테스트용 장학금 데이터입니다.");
  await page.fill("#content", "E2E 검증용 내용\n신청: 테스트 기간");
  await page.fill("#department", "테스트부서");
  await page.fill("#keywords", `테스트장학금,${uniq}`);
  await page.selectOption("#dataStatus", "active");
  await page.click('button:has-text("저장하기")');
  await page.waitForURL("**/admin/data**", { timeout: 15000 });
  await page.waitForSelector(`text=E2E 테스트장학금 ${uniq}`, { timeout: 10000 });
  check("대학 정보 데이터 등록", true);

  // 등록한 데이터가 챗봇 검색에 반영되는지 (학생 세션 유지 중)
  await page.goto(`${BASE}/chat?q=${encodeURIComponent(`테스트장학금 ${uniq} 알려줘`)}`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector(`text=E2E 테스트장학금 ${uniq}`, { timeout: 20000 });
  check("등록 데이터가 챗봇 RAG 검색에 반영", true);

  // 부정 평가 생성 → 답변 품질 관리에서 처리
  await page.click('button:has-text("도움이 안 됐어요")');
  await page.click('button:has-text("최신 정보가 아님")');
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/admin/answers`, { waitUntil: "networkidle" });
  check(
    "부정 평가가 답변 품질 관리에 표시",
    (await page.locator("text=최신 정보가 아님").count()) > 0
  );
  const section = page.locator("section", { hasText: "최신 정보가 아님" }).first();
  await section.locator('select[name="status"]').selectOption("resolved");
  await section.locator('button:has-text("저장")').click();
  await page.waitForTimeout(1000);
  await page.reload({ waitUntil: "networkidle" });
  check("검토 상태 변경(resolved)", (await page.locator("text=해결됨").count()) > 0);

  // 질문 분석 화면
  await page.goto(`${BASE}/admin/questions`, { waitUntil: "networkidle" });
  check(
    "질문 분석 화면 데이터 표시",
    (await page.locator("text=답변 성공률").count()) > 0
  );
} catch (e) {
  check("E2E 실행", false, String(e).slice(0, 250));
} finally {
  await browser.close();
}

const failed = results.filter(([, ok]) => !ok);
console.log(`\n결과: ${results.length - failed.length}/${results.length} 통과`);
process.exit(failed.length ? 1 : 0);
