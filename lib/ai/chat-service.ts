import type { ChatRequest, ChatResponse } from "@/types/chat";
import { kstDateKey } from "@/lib/utils";
import { searchSources } from "./rag-service";
import { findRelatedNotices, toSourceItem } from "./source-service";

/**
 * 챗봇 답변 서비스 레이어.
 * - CHATBOT_API_URL 설정 시: 실제 AI/RAG 서버 호출 (동일한 ChatResponse 규격)
 * - 미설정 시: Mock 서비스 — 관리자 데이터 기반 키워드 RAG + 템플릿 답변
 *
 * UI 는 이 레이어의 ChatResponse 만 사용하므로, 실제 AI 서버 연동 시
 * UI 코드를 수정할 필요가 없습니다.
 */

export function isRemoteConfigured(): boolean {
  return Boolean(process.env.CHATBOT_API_URL);
}

async function remoteGenerate(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(process.env.CHATBOT_API_URL as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.CHATBOT_API_KEY
        ? { Authorization: `Bearer ${process.env.CHATBOT_API_KEY}` }
        : {}),
    },
    body: JSON.stringify(req),
    cache: "no-store",
    // 서버리스 함수 시간 제한 전에 끊어, 오류 응답을 저장하고 사용자에게 알릴 수 있게 함
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Chat API error: ${res.status}`);
  return (await res.json()) as ChatResponse;
}

const FOLLOW_UPS: Record<string, string[]> = {
  장학금: [
    "신청 자격도 알려줘.",
    "필요한 제출 서류가 뭐야?",
    "담당 부서 연락처를 알려줘.",
    "다른 장학금도 찾아줘.",
  ],
  학사정보: [
    "신청 방법을 자세히 알려줘.",
    "관련 학사일정을 알려줘.",
    "담당 부서 연락처를 알려줘.",
  ],
  "비교과 프로그램": [
    "신청 자격이 어떻게 돼?",
    "신청 마감일이 언제야?",
    "취업 관련 프로그램도 찾아줘.",
  ],
  "대학 생활정보": [
    "운영시간을 알려줘.",
    "위치가 어디야?",
    "관련 문의처를 알려줘.",
  ],
  기본: [
    "더 자세히 알려줘.",
    "담당 부서 연락처를 알려줘.",
    "관련 일정을 알려줘.",
  ],
};

function fmtDate(d: Date | null): string | null {
  return d ? kstDateKey(d) : null;
}

async function mockGenerate(req: ChatRequest): Promise<ChatResponse> {
  const now = new Date().toISOString();
  const sources = await searchSources(req.message, 3);

  if (sources.length === 0) {
    return {
      conversationId: req.conversationId ?? "",
      answerId: `ans-${Date.now()}`,
      answer:
        "관련 정보를 찾지 못했습니다.\n질문을 조금 더 구체적으로 입력하거나, 아래 추천 질문을 활용해 보세요.\n\n예시 주제: 장학금, 수강신청, 휴·복학, 학사일정, 졸업요건, 도서관, 기숙사, 통학버스, 비교과 프로그램",
      summary: "관련 정보를 찾지 못했습니다.",
      sources: [],
      relatedNotices: [],
      followUpQuestions: [
        "이번 학기 수강신청 기간을 알려줘.",
        "현재 신청할 수 있는 장학금이 있어?",
        "도서관 운영시간을 알려줘.",
      ],
      generatedAt: now,
      status: "no_result",
      isDemo: true,
    };
  }

  const top = sources[0];
  const lines: string[] = [];
  lines.push(`${top.summary} (데모 답변)`);
  lines.push("");
  // 설정 '간단한 설명': 가장 관련 높은 항목의 핵심만 (나머지는 출처 목록에서 확인)
  const simple = req.preferences?.answerLength === "simple";
  (simple ? sources.slice(0, 1) : sources).forEach((s, i) => {
    lines.push(`${i + 1}. ${s.title}`);
    const period =
      s.startAt || s.endAt
        ? `   · 기간: ${fmtDate(s.startAt) ?? "-"} ~ ${fmtDate(s.endAt) ?? "-"}`
        : null;
    if (period) lines.push(period);
    lines.push(`   · 담당: ${s.department}`);
    if (simple) return;
    const firstLine = s.content.split("\n").find((l) => l.trim());
    if (firstLine) lines.push(`   · ${firstLine.trim()}`);
  });
  lines.push("");
  lines.push(
    simple
      ? "자세한 내용은 아래 출처에서 확인하세요."
      : "중요한 신청·행정 업무는 반드시 아래 공식 출처의 원문과 담당 부서를 확인해 주세요."
  );

  const followUps =
    FOLLOW_UPS[top.category] ?? FOLLOW_UPS["기본"];

  return {
    conversationId: req.conversationId ?? "",
    answerId: `ans-${Date.now()}`,
    answer: lines.join("\n"),
    summary: top.summary,
    sources: sources.map(toSourceItem),
    relatedNotices: await findRelatedNotices(
      [...new Set(sources.map((s) => s.category))],
      3
    ),
    followUpQuestions: followUps,
    generatedAt: now,
    dataCheckedAt: kstDateKey(top.dataCheckedAt),
    status: sources.length < 2 ? "partial" : "success",
    isDemo: true,
  };
}

export async function generateAnswer(req: ChatRequest): Promise<ChatResponse> {
  if (isRemoteConfigured()) return remoteGenerate(req);
  return mockGenerate(req);
}
