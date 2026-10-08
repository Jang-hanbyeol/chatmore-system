import { db } from "@/lib/database/db";

/**
 * RAG 검색 서비스 (데모 구현).
 *
 * 실제 서비스에서는 벡터 데이터베이스의 의미 기반 검색으로 교체됩니다.
 * 데모 단계에서는 관리자에 등록된 InformationSource(대학 정보 데이터)를
 * 키워드 스코어링으로 검색해 동일한 데이터 흐름(검색 → 답변 → 출처)을
 * 재현합니다. AI 검색 포함(isAiSearchable)과 데이터 상태(active)를
 * 존중하므로 관리자 데이터 관리가 챗봇 응답에 실제로 반영됩니다.
 */

export type RankedSource = Awaited<
  ReturnType<typeof db.informationSource.findMany>
>[number] & { score: number };

const STOPWORDS = ["알려줘", "알려줘요", "찾아줘", "어떻게", "뭐야", "있어", "해줘", "해야", "인가요", "될까", "언제", "좀", "방법", "관련", "정보", "대해", "대한", "이번", "지금"];

export function tokenize(query: string): string[] {
  return query
    .replace(/[?.!,]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOPWORDS.includes(t))
    .slice(0, 8);
}

export async function searchSources(
  query: string,
  limit = 3
): Promise<RankedSource[]> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const candidates = await db.informationSource.findMany({
    where: {
      isAiSearchable: true,
      dataStatus: "active",
      OR: tokens.flatMap((t) => [
        { title: { contains: t } },
        { keywords: { contains: t } },
        { summary: { contains: t } },
        { content: { contains: t } },
      ]),
    },
    take: 30,
  });

  const scored = candidates
    .map((s) => {
      let score = 0;
      for (const t of tokens) {
        if (s.title.includes(t)) score += 5;
        if (s.keywords.includes(t)) score += 4;
        if (s.summary.includes(t)) score += 2;
        if (s.content.includes(t)) score += 1;
      }
      return { ...s, score };
    })
    .filter((s) => s.score >= 2) // 본문 단독 1점 매치는 노이즈로 제외
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
