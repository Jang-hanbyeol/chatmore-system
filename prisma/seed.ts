/* Chatmore System 초기 샘플 데이터 시드 (npx tsx prisma/seed.ts)
 * 모든 데이터는 데모용 예시이며 실제 대학 공지가 아닙니다. */
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../lib/generated/prisma/client";
import { libsqlConfig } from "../lib/database/connection";

const here = path.dirname(fileURLToPath(import.meta.url));
const adapter = new PrismaLibSql(libsqlConfig(here));
const prisma = new PrismaClient({ adapter });

const D = (s: string) => new Date(`${s}T09:00:00+09:00`);

async function main() {
  /* ── 관리자 ── */
  const adminEmail = process.env.ADMIN_EMAIL || "admin@chatmore.kr";
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: process.env.ADMIN_NAME || "Chatmore 관리자",
      passwordHash: await bcrypt.hash(
        process.env.ADMIN_PASSWORD || "chatmore1234!",
        10
      ),
    },
  });
  console.log(`관리자 준비: ${adminEmail}`);

  /* ── 데모 학생 계정 ── */
  const demoPw = await bcrypt.hash(
    process.env.DEMO_USER_PASSWORD || "chatmore-demo",
    10
  );
  const demoUsers = [
    {
      email: "student@demo.chatmore.kr",
      name: "김순천",
      userType: "재학생",
      college: "공과대학",
      department: "컴퓨터공학과",
      grade: "3학년",
      admissionYear: "2024",
      interests: "장학금,학사일정,비교과 프로그램,도서관",
      onboarded: true,
    },
    {
      email: "freshman@demo.chatmore.kr",
      name: "박새내",
      userType: "신입생",
      college: "인문예술대학",
      department: "영어영문학과",
      grade: "1학년",
      admissionYear: "2026",
      interests: "수강신청,기숙사,통학버스,학생식당",
      onboarded: false, // 온보딩 체험용
    },
    {
      email: "grad@demo.chatmore.kr",
      name: "이연구",
      userType: "대학원생",
      college: "대학원",
      department: "생명산업과학과",
      grade: "석사 2학기",
      admissionYear: "2025",
      interests: "장학금,행사",
      onboarded: true,
    },
    {
      email: "global@demo.chatmore.kr",
      name: "Nguyen Minh",
      userType: "외국인 유학생",
      college: "글로벌융합대학",
      department: "한국어교육",
      grade: "2학년",
      admissionYear: "2025",
      interests: "기숙사,학생식당,행사",
      onboarded: true,
    },
  ];
  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: demoPw, isDemo: true },
    });
  }
  console.log(`데모 학생 계정 ${demoUsers.length}건 준비`);

  /* ── 카테고리 ── */
  const categories = [
    "학사정보",
    "장학금",
    "비교과 프로그램",
    "취업·창업",
    "대학원",
    "기숙사",
    "통학버스",
    "도서관",
    "학생식당",
    "교내 시설",
    "행정부서",
    "행사 및 공지",
  ];
  for (let i = 0; i < categories.length; i++) {
    const slug = `cat-${i + 1}`;
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { slug, name: categories[i], sortOrder: i + 1 },
    });
  }

  /* ── 대학 정보 데이터 (RAG 소스, 데모) ── */
  const SCNU = "https://www.scnu.ac.kr/";
  const infoSources = [
    {
      title: "2026-2학기 교내 장학금 신청 안내",
      category: "장학금",
      summary: "성적우수·생활지원 등 교내 장학금 신청 기간과 조건 안내입니다.",
      content:
        "교내 성적우수 장학금: 직전 학기 평점 3.5 이상, 9월 5일까지 포털에서 신청\n생활지원 장학금: 소득 구간 확인 후 학생지원과 방문 접수\n제출 서류: 신청서, 성적증명서(해당자)",
      department: "학생지원과",
      targetUsers: "재학생",
      keywords: "장학금,교내장학금,성적우수,생활지원,신청",
      startAt: D("2026-08-18"),
      endAt: D("2026-09-05"),
    },
    {
      title: "국가장학금 2차 신청 일정",
      category: "장학금",
      summary: "국가장학금 2차 신청 기간과 방법 안내입니다.",
      content:
        "신청 기간: 8월 20일 ~ 9월 10일\n신청 방법: 한국장학재단 홈페이지에서 온라인 신청\n1차 미신청자와 복학생은 반드시 2차 기간에 신청해야 합니다.",
      department: "학생지원과",
      targetUsers: "재학생,복학생,신입생",
      keywords: "국가장학금,한국장학재단,2차,신청",
      startAt: D("2026-08-20"),
      endAt: D("2026-09-10"),
    },
    {
      title: "2026-2학기 수강신청 일정 안내",
      category: "학사정보",
      summary: "장바구니 신청과 본 수강신청, 수강 정정 일정 안내입니다.",
      content:
        "장바구니(예비) 신청: 8월 10일 ~ 8월 12일\n본 수강신청: 8월 18일 ~ 8월 21일 (학년별 시간 상이)\n수강 정정: 개강 후 1주일 이내\n포털 수강신청 시스템에서 진행합니다.",
      department: "학사지원과",
      targetUsers: "전체",
      keywords: "수강신청,장바구니,수강정정,포털",
      startAt: D("2026-08-10"),
      endAt: D("2026-08-21"),
    },
    {
      title: "휴학·복학 신청 안내",
      category: "학사정보",
      summary: "2026-2학기 휴학·복학 신청 기간과 절차 안내입니다.",
      content:
        "복학 신청: 8월 1일 ~ 8월 14일, 포털 → 학적 변동 메뉴\n일반휴학: 등록금 납부 전 신청 시 전액 이월\n군휴학: 입영통지서 사본 첨부 필요",
      department: "학사지원과",
      targetUsers: "재학생,복학생",
      keywords: "휴학,복학,학적,군휴학",
      startAt: D("2026-08-01"),
      endAt: D("2026-08-14"),
    },
    {
      title: "2026학년도 2학기 학사일정",
      category: "학사정보",
      summary: "개강, 시험, 종강 등 2학기 주요 학사일정입니다.",
      content:
        "9월 1일 개강\n10월 20일 ~ 24일 중간고사\n12월 8일 ~ 12일 기말고사\n12월 15일 종강",
      department: "학사지원과",
      targetUsers: "전체",
      keywords: "학사일정,개강,중간고사,기말고사,종강",
    },
    {
      title: "졸업요건 안내 (2020학번 이후)",
      category: "학사정보",
      summary: "총 이수학점, 졸업인증, 졸업논문 등 졸업요건 안내입니다.",
      content:
        "총 이수학점 130학점 이상 (전공 66, 교양 30)\n졸업인증: 어학 성적 또는 대체 프로그램 이수\n졸업논문 또는 캡스톤디자인 이수\n학과별 기준은 소속 학과 공지 확인",
      department: "학사지원과",
      targetUsers: "재학생",
      keywords: "졸업,졸업요건,이수학점,졸업인증,캡스톤",
    },
    {
      title: "증명서 발급 안내",
      category: "행정부서",
      summary: "재학·성적 등 각종 증명서 발급 방법 안내입니다.",
      content:
        "온라인 발급: 포털 → 증명서 발급 (PDF, 무료)\n무인발급기: 대학본부 1층, 도서관 로비\n전화 문의: 학사지원과",
      department: "학사지원과",
      targetUsers: "전체",
      keywords: "증명서,재학증명서,성적증명서,발급",
    },
    {
      title: "도서관 운영시간 안내",
      category: "도서관",
      summary: "학기 중·방학 중 도서관 운영시간과 대출 규정입니다.",
      content:
        "학기 중: 평일 09:00~22:00, 주말 10:00~17:00\n방학 중: 평일 09:00~18:00, 주말 휴관\n열람실: 24시간 개방 (학생증 필요)\n대출: 재학생 10권 14일, 1회 연장 가능",
      department: "도서관",
      targetUsers: "전체",
      keywords: "도서관,운영시간,열람실,대출",
    },
    {
      title: "학생식당 운영 안내",
      category: "학생식당",
      summary: "학생식당·교직원식당 운영시간과 식단 확인 방법입니다.",
      content:
        "학생식당: 평일 11:30~13:30 / 17:00~18:30\n교직원식당: 평일 11:30~13:00\n식단은 포털 '식단 안내'에서 확인\n방학 중 운영시간 단축 가능",
      department: "총무과",
      targetUsers: "전체",
      keywords: "학생식당,학식,식단,교직원식당",
    },
    {
      title: "생활관(기숙사) 2학기 입사 안내",
      category: "기숙사",
      summary: "2학기 생활관 입사 신청 기간과 선발 기준입니다.",
      content:
        "입사 신청: 7월 28일 ~ 8월 8일, 포털 신청\n선발 기준: 거리 점수 + 직전 학기 성적\n입사일: 8월 30일 ~ 31일\n문의: 생활관 행정실",
      department: "생활관",
      targetUsers: "전체",
      keywords: "기숙사,생활관,입사,신청",
      startAt: D("2026-07-28"),
      endAt: D("2026-08-08"),
    },
    {
      title: "통학버스 2학기 운행 안내",
      category: "통학버스",
      summary: "순천 시내·광양·여수 노선 통학버스 운행 시간표입니다.",
      content:
        "순천 시내: 등교 08:00 / 08:40, 하교 17:10 / 18:10\n광양·여수: 등교 07:40, 하교 17:30\n방학 중 감축 운행",
      department: "총무과",
      targetUsers: "전체",
      keywords: "통학버스,셔틀,시간표,노선",
    },
    {
      title: "8월 비교과 프로그램 모집",
      category: "비교과 프로그램",
      summary: "AI 특강, 취업 클리닉 등 8월 신청 가능한 비교과 프로그램입니다.",
      content:
        "AI 활용 역량 강화 특강: 8월 12일, 선착순 60명\n취업 서류 클리닉: 상시, 대학일자리플러스센터\n비교과 포인트 적립 여부는 각 공지 확인",
      department: "교육혁신원",
      targetUsers: "재학생",
      keywords: "비교과,특강,프로그램,포인트,AI",
      startAt: D("2026-08-01"),
      endAt: D("2026-08-12"),
    },
    {
      title: "창업 아이디어 경진대회 공고",
      category: "취업·창업",
      summary: "재학생 대상 창업 아이디어 경진대회 참가 안내입니다.",
      content:
        "접수: 9월 1일까지\n대상: 재학생 개인 또는 3인 이내 팀\n시상: 총 500만원 규모 (데모 예시)\n문의: 창업지원단",
      department: "창업지원단",
      targetUsers: "재학생,대학원생",
      keywords: "창업,경진대회,아이디어,공모",
      endAt: D("2026-09-01"),
    },
    {
      title: "등록금 납부 안내",
      category: "학사정보",
      summary: "2학기 등록금 납부 기간과 방법 안내입니다.",
      content:
        "납부 기간: 8월 22일 ~ 8월 28일\n납부 방법: 가상계좌 이체 또는 카드 납부\n분할 납부는 사전 신청자에 한함",
      department: "재무과",
      targetUsers: "전체",
      keywords: "등록금,납부,가상계좌,분할납부",
      startAt: D("2026-08-22"),
      endAt: D("2026-08-28"),
    },
    {
      title: "(검토 필요 예시) 지난 학기 장학금 안내",
      category: "장학금",
      summary: "지난 학기 데이터 예시 — 관리자 화면의 상태 관리 확인용입니다.",
      content: "이 데이터는 needs_review 상태 예시로, AI 검색에서 제외됩니다.",
      department: "학생지원과",
      targetUsers: "재학생",
      keywords: "장학금,지난학기",
      dataStatus: "needs_review",
      isAiSearchable: false,
    },
  ];
  if ((await prisma.informationSource.count()) === 0) {
    for (const s of infoSources) {
      await prisma.informationSource.create({
        data: { sourceUrl: SCNU, ...s },
      });
    }
  }
  console.log(`대학 정보 데이터 ${infoSources.length}건 준비`);

  /* ── 공지 ── */
  const notices = [
    {
      title: "2026-2학기 교내 장학금 신청 시작",
      category: "장학금",
      summary: "교내 장학금 신청이 8월 18일부터 시작됩니다.",
      content:
        "<h2>교내 장학금 신청</h2><p>성적우수·생활지원 장학금 신청이 시작됩니다. 마감은 9월 5일입니다.</p><ul><li>신청: 학교 포털</li><li>문의: 학생지원과</li></ul>",
      department: "학생지원과",
      startAt: D("2026-08-18"),
      endAt: D("2026-09-05"),
      isPinned: true,
    },
    {
      title: "2학기 수강신청 일정 안내",
      category: "학사정보",
      summary: "본 수강신청은 8월 18일~21일, 학년별 접속 시간을 확인하세요.",
      content:
        "<h2>수강신청 일정</h2><p>장바구니 신청 8/10~12, 본 수강신청 8/18~21.</p><p>학년별 접속 시간은 포털 공지를 확인해 주세요.</p>",
      department: "학사지원과",
      startAt: D("2026-08-10"),
      endAt: D("2026-08-21"),
      isPinned: true,
    },
    {
      title: "생활관 2학기 입사 신청 마감 임박",
      category: "기숙사",
      summary: "생활관 입사 신청이 8월 8일 마감됩니다.",
      content:
        "<h2>생활관 입사 신청</h2><p>신청 마감: 8월 8일. 포털에서 신청 가능합니다.</p>",
      department: "생활관",
      endAt: D("2026-08-08"),
    },
    {
      title: "AI 활용 역량 강화 특강 모집",
      category: "비교과 프로그램",
      summary: "8월 12일 AI 특강, 선착순 60명 모집합니다.",
      content:
        "<h2>AI 특강</h2><p>일시: 8월 12일 14:00 / 장소: 공학관 세미나실</p><p>선착순 60명, 비교과 포인트 적립.</p>",
      department: "교육혁신원",
      endAt: D("2026-08-12"),
    },
    {
      title: "창업 아이디어 경진대회 접수 안내",
      category: "취업·창업",
      summary: "9월 1일까지 창업 아이디어 경진대회 접수를 받습니다.",
      content:
        "<h2>창업 경진대회</h2><p>재학생 누구나 참여 가능하며 9월 1일 접수 마감입니다.</p>",
      department: "창업지원단",
      endAt: D("2026-09-01"),
    },
    {
      title: "도서관 하계 운영시간 변경",
      category: "도서관",
      summary: "방학 중 도서관은 평일 09:00~18:00 운영합니다.",
      content:
        "<h2>하계 운영시간</h2><p>방학 중 평일 09:00~18:00, 주말 휴관. 열람실은 24시간 개방.</p>",
      department: "도서관",
    },
    {
      title: "Chatmore 시범 운영 안내",
      category: "행사 및 공지",
      summary: "본 시스템은 시범 운영 중이며 답변은 데모 데이터 기반입니다.",
      content:
        "<h2>시범 운영 안내</h2><p>Chatmore는 시범 운영 준비 단계입니다. 현재 챗봇 답변은 데모 데이터를 기반으로 하며, 실제 학사 정보는 공식 홈페이지를 확인해 주세요.</p>",
      department: "Chatmore 팀",
      isPinned: true,
    },
    {
      title: "(임시저장 예시) 2학기 행사 일정",
      category: "행사 및 공지",
      summary: "관리자 화면 확인용 임시저장 공지입니다.",
      content: "<p>draft 상태 예시 — 학생 화면에는 노출되지 않습니다.</p>",
      department: "학생지원과",
      status: "draft",
    },
  ];
  if ((await prisma.notice.count()) === 0) {
    for (const n of notices) {
      await prisma.notice.create({ data: { sourceUrl: SCNU, ...n } });
    }
  }
  console.log(`공지 ${notices.length}건 준비`);

  /* ── 일정 ── */
  const events = [
    { title: "장바구니 수강신청", category: "학사", startAt: D("2026-08-10"), endAt: D("2026-08-12") },
    { title: "휴학·복학 신청 마감", category: "학사", startAt: D("2026-08-14"), isDeadline: true },
    { title: "본 수강신청", category: "학사", startAt: D("2026-08-18"), endAt: D("2026-08-21") },
    { title: "교내 장학금 신청", category: "장학금", startAt: D("2026-08-18"), endAt: D("2026-09-05") },
    { title: "국가장학금 2차 신청", category: "장학금", startAt: D("2026-08-20"), endAt: D("2026-09-10") },
    { title: "등록금 납부", category: "등록", startAt: D("2026-08-22"), endAt: D("2026-08-28") },
    { title: "생활관 입사 신청 마감", category: "기타", startAt: D("2026-08-08"), isDeadline: true },
    { title: "AI 활용 역량 강화 특강", category: "비교과", startAt: D("2026-08-12") },
    { title: "창업 경진대회 접수 마감", category: "비교과", startAt: D("2026-09-01"), isDeadline: true },
    { title: "2학기 개강", category: "학사", startAt: D("2026-09-01") },
    { title: "중간고사", category: "학사", startAt: D("2026-10-20"), endAt: D("2026-10-24") },
  ];
  if ((await prisma.scheduleEvent.count()) === 0) {
    for (const e of events) await prisma.scheduleEvent.create({ data: e });
  }
  console.log(`일정 ${events.length}건 준비`);

  /* ── 데모 사용자 알림 ── */
  const demo = await prisma.user.findUnique({
    where: { email: "student@demo.chatmore.kr" },
  });
  if (demo && (await prisma.notification.count()) === 0) {
    const notis = [
      {
        notificationType: "deadline",
        title: "교내 장학금 신청 마감 D-30",
        content: "교내 장학금 신청이 9월 5일 마감됩니다.",
        link: "/explore/scholarship",
      },
      {
        notificationType: "important",
        title: "본 수강신청이 곧 시작됩니다",
        content: "8월 18일부터 학년별로 수강신청이 진행됩니다.",
        link: "/calendar",
      },
      {
        notificationType: "system",
        title: "Chatmore 시범 운영 안내",
        content: "현재 답변은 데모 데이터 기반입니다.",
        link: "/notice",
      },
    ];
    for (const n of notis) {
      await prisma.notification.create({ data: { userId: demo.id, ...n } });
    }
    console.log("데모 알림 준비");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
