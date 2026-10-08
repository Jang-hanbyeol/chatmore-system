"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { safeHttpUrl } from "@/lib/utils/url";
import {
  AlertTriangle,
  Bookmark,
  Copy,
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  SendHorizonal,
  Square,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { sendChatMessage } from "@/lib/actions/chat";
import { submitAnswerFeedback, toggleBookmark } from "@/lib/actions/user";
import type { RelatedNotice, SourceItem } from "@/types/chat";
import { SymbolBadge } from "@/components/ui/Logo";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { NOT_HELPFUL_REASONS } from "@/lib/validation/schemas";
import { cn, ddayLabel, formatTime, relativeTime } from "@/lib/utils";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  summary?: string | null;
  sources: SourceItem[];
  notices: RelatedNotice[];
  followUps: string[];
  dataCheckedAt?: string | null;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  isBookmarked: boolean;
  updatedAt: string;
};

const SUGGESTED = [
  { cat: "학사", q: "이번 학기 수강신청 기간을 알려줘." },
  { cat: "장학금", q: "현재 신청할 수 있는 장학금이 있어?" },
  { cat: "비교과", q: "이번 달 신청 가능한 비교과 프로그램을 찾아줘." },
  { cat: "대학 생활", q: "도서관과 학생식당 운영시간을 알려줘." },
  { cat: "시설·행정", q: "재학증명서는 어디에서 발급할 수 있어?" },
];

const MAX_LEN = 1000;

export function ChatScreen({
  conversations,
  activeId,
  activeTitle,
  initialMessages,
  initialQuestion,
  showSuggestions,
  autoExpandSources,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  activeTitle: string | null;
  initialMessages: UiMessage[];
  initialQuestion?: string;
  showSuggestions: boolean;
  autoExpandSources: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(activeId);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState("");
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null); // 부정 평가 사유 모달
  const [sheetOpen, setSheetOpen] = useState(false); // 모바일 출처 바텀시트
  const [feedbackDone, setFeedbackDone] = useState<Record<string, string>>({});
  const stopRef = useRef(false);
  const inFlightRef = useRef(false);
  const sentInitial = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // 홈 빠른 질문 등에서 전달된 초기 질문 자동 전송
  useEffect(() => {
    if (initialQuestion && !sentInitial.current) {
      sentInitial.current = true;
      void ask(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  async function ask(raw: string) {
    const question = raw.trim().slice(0, MAX_LEN);
    if (!question || pending) return;
    // 중지 후에도 이전 요청이 서버에서 끝나기 전에는 새 질문을 막는다 (대화 분리 방지)
    if (inFlightRef.current) {
      setToast("이전 질문을 마무리하는 중입니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    inFlightRef.current = true;
    stopRef.current = false;
    setInput("");
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [
      ...m,
      {
        id: tempId,
        role: "user",
        content: question,
        status: "success",
        sources: [],
        notices: [],
        followUps: [],
        createdAt: new Date().toISOString(),
      },
    ]);
    setPending(true);
    try {
      const res = await sendChatMessage({
        conversationId: conversationId ?? undefined,
        message: question,
      });
      if (!res.ok) {
        if (!stopRef.current) {
          setToast(res.error);
          setInput((cur) => cur || question); // 실패한 질문을 입력창에 복원
        }
        return;
      }
      const isNew = !conversationId;
      if (isNew) setConversationId(res.conversationId);
      if (stopRef.current) {
        // 사용자가 중지: 답변은 표시하지 않되, 서버에 생긴 대화는 이어서 사용
        if (isNew) router.replace(`/chat/${res.conversationId}`, { scroll: false });
        return;
      }
      const r = res.response;
      setMessages((m) => [
        ...m.map((msg) => (msg.id === tempId ? { ...msg, id: res.userMessageId } : msg)),
        {
          id: res.assistantMessageId,
          role: "assistant",
          content: r.answer,
          status: r.status,
          summary: r.summary,
          sources: r.sources,
          notices: r.relatedNotices ?? [],
          followUps: r.followUpQuestions ?? [],
          dataCheckedAt: r.dataCheckedAt,
          createdAt: r.generatedAt,
        },
      ]);
      // 새 대화는 라우터로 이동(history.replaceState + refresh 는 ?q= 페이지를 다시
      // 마운트해 같은 질문을 한 번 더 보냈음). 기존 대화는 목록만 갱신.
      if (isNew) router.replace(`/chat/${res.conversationId}`, { scroll: false });
      else router.refresh();
    } catch {
      if (!stopRef.current) {
        setToast("네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해 주세요.");
        setInput((cur) => cur || question);
      }
    } finally {
      inFlightRef.current = false;
      setPending(false);
      inputRef.current?.focus();
    }
  }

  async function sendFeedback(
    messageId: string,
    type: "helpful" | "not_helpful",
    reason?: string
  ) {
    setFeedbackDone((f) => ({ ...f, [messageId]: type }));
    setFeedbackFor(null);
    const res = await submitAnswerFeedback({
      messageId,
      feedbackType: type,
      reason,
    });
    setToast(res.message);
  }

  async function bookmarkAnswer(m: UiMessage) {
    const res = await toggleBookmark({
      itemType: "answer",
      itemId: m.id,
      title: m.summary || m.content.slice(0, 60),
      meta: conversationId ? `/chat/${conversationId}` : undefined,
    });
    setToast(res.bookmarked ? "답변이 즐겨찾기에 저장되었습니다." : "즐겨찾기에서 제거되었습니다.");
  }

  function copyText(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => setToast("복사되었습니다."),
      () => setToast("복사에 실패했습니다.")
    );
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="mx-auto grid h-[calc(100dvh-3.5rem)] w-full max-w-[1400px] gap-4 p-3 md:p-4 lg:h-dvh lg:grid-cols-[250px_1fr_290px] lg:p-5">
      {/* 좌: 대화 목록 */}
      <aside className="hidden min-h-0 flex-col lg:flex" aria-label="대화 목록">
        <Link
          href="/chat"
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-active"
        >
          <Plus size={16} aria-hidden /> 새 대화
        </Link>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-lg border border-hairline bg-surface p-2 thin-scroll">
          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted">
              아직 대화가 없습니다.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/chat/${c.id}`}
                    className={cn(
                      "block rounded-md px-3 py-2.5",
                      c.id === conversationId
                        ? "bg-primary/10"
                        : "hover:bg-soft"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {c.isBookmarked && (
                        <Bookmark size={11} className="shrink-0 fill-primary text-primary" aria-label="즐겨찾기" />
                      )}
                      <span
                        className={cn(
                          "truncate text-[13px] font-medium",
                          c.id === conversationId ? "text-primary" : "text-ink"
                        )}
                      >
                        {c.title}
                      </span>
                    </span>
                    <span className="text-[11px] text-muted">{relativeTime(c.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href="/history" className="mt-2 text-center text-xs text-body hover:text-ink">
          대화 기록 전체 보기
        </Link>
      </aside>

      {/* 중앙: 채팅 */}
      <section
        aria-label="Chatmore 대화"
        className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-hairline bg-surface"
      >
        <header className="flex items-center justify-between border-b border-hairline-soft px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <SymbolBadge size={30} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {activeTitle ?? "새 대화"}
              </p>
              <p className="text-[11px] text-muted">AI 대학 생활정보 챗봇</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge tone="amber">데모 응답</Badge>
            <Link
              href="/chat"
              className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-body hover:bg-soft hover:text-ink lg:hidden"
            >
              새 대화
            </Link>
          </div>
        </header>

        {/* 메시지 */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 thin-scroll md:p-5">
          {messages.length === 0 && !pending && (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <SymbolBadge size={52} />
              <h2 className="mt-5 text-xl font-semibold text-ink">무엇을 도와드릴까요?</h2>
              <p className="mt-2 text-sm text-body">
                대학 생활에 필요한 정보를 질문해 보세요.
              </p>
              <ul className="mt-7 w-full max-w-md space-y-2 text-left">
                {SUGGESTED.map((s) => (
                  <li key={s.q}>
                    <button
                      type="button"
                      onClick={() => ask(s.q)}
                      className="flex w-full items-center gap-3 rounded-md border border-hairline px-4 py-3 text-left hover:border-primary"
                    >
                      <Badge tone="blue" className="shrink-0">{s.cat}</Badge>
                      <span className="text-sm text-ink">{s.q}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex flex-col items-end gap-1">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-primary px-4 py-2.5 text-[15px] leading-relaxed text-white">
                  {m.content}
                </p>
                <span className="flex items-center gap-0.5 text-[11px] text-muted">
                  {formatTime(m.createdAt)}
                  <button
                    type="button"
                    aria-label="질문 복사"
                    onClick={() => copyText(m.content)}
                    className="ml-1 rounded p-1 hover:bg-soft hover:text-ink"
                  >
                    <Copy size={11} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="수정 후 다시 질문"
                    onClick={() => {
                      setInput(m.content);
                      inputRef.current?.focus();
                    }}
                    className="rounded p-1 hover:bg-soft hover:text-ink"
                  >
                    <Pencil size={11} aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="같은 질문 다시 보내기"
                    onClick={() => ask(m.content)}
                    className="rounded p-1 hover:bg-soft hover:text-ink"
                  >
                    <RotateCcw size={11} aria-hidden />
                  </button>
                </span>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2.5">
                <SymbolBadge size={30} />
                <div className="min-w-0 max-w-[90%] space-y-2.5">
                  <div
                    className={cn(
                      "rounded-lg rounded-tl-sm px-4 py-3",
                      m.status === "error" ? "bg-down/5" : "bg-soft"
                    )}
                  >
                    {m.status !== "error" && (
                      <p className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Badge tone="amber">데모 응답</Badge>
                        {m.dataCheckedAt && (
                          <span className="text-[11px] text-muted">
                            데이터 기준일 {m.dataCheckedAt}
                          </span>
                        )}
                        {m.sources.length > 0 && (
                          <span className="text-[11px] text-muted">
                            · 출처 {m.sources.length}개
                          </span>
                        )}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink">
                      {m.content}
                    </p>
                  </div>

                  {/* 출처 (모바일: 버튼 → 바텀시트 / 데스크톱: 요약 카드) */}
                  {m.sources.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSheetOpen(true)}
                        className="flex items-center gap-1.5 rounded-md border border-hairline px-3 py-2 text-xs font-semibold text-ink hover:border-primary lg:hidden"
                      >
                        <FileText size={13} aria-hidden /> 출처 {m.sources.length}개 보기
                      </button>
                      <div className="hidden space-y-1.5 lg:block">
                        {m.sources.slice(0, autoExpandSources ? undefined : 2).map((s) => (
                          <SourceRow key={s.id} source={s} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* 관련 공지 */}
                  {m.notices.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted">관련 공지</p>
                      {m.notices.map((n) => (
                        <Link
                          key={n.id}
                          href={`/notice/${n.id}`}
                          className="flex items-center justify-between gap-2 rounded-md border border-hairline px-3 py-2 text-xs hover:border-primary"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-ink">{n.title}</span>
                            <span className="text-muted">
                              {n.category} · {n.department}
                            </span>
                          </span>
                          {n.endAt && ddayLabel(n.endAt) && (
                            <Badge tone={ddayLabel(n.endAt) === "마감됨" ? "neutral" : "amber"}>
                              {ddayLabel(n.endAt)}
                            </Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* 액션 */}
                  {m.status !== "error" && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        disabled={Boolean(feedbackDone[m.id])}
                        onClick={() => sendFeedback(m.id, "helpful")}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium",
                          feedbackDone[m.id] === "helpful"
                            ? "bg-up/10 text-up"
                            : "bg-strong text-body hover:text-ink disabled:opacity-50"
                        )}
                      >
                        <ThumbsUp size={12} aria-hidden /> 유용해요
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(feedbackDone[m.id])}
                        onClick={() => setFeedbackFor(m.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-medium",
                          feedbackDone[m.id] === "not_helpful"
                            ? "bg-down/10 text-down"
                            : "bg-strong text-body hover:text-ink disabled:opacity-50"
                        )}
                      >
                        <ThumbsDown size={12} aria-hidden /> 도움이 안 됐어요
                      </button>
                      <Link
                        href={`/feedback?messageId=${m.id}`}
                        className="inline-flex items-center gap-1.5 rounded-sm bg-strong px-2.5 py-1.5 text-xs font-medium text-body hover:text-ink"
                      >
                        <AlertTriangle size={12} aria-hidden /> 오류 신고
                      </Link>
                      <button
                        type="button"
                        onClick={() => copyText(m.content)}
                        className="inline-flex items-center gap-1.5 rounded-sm bg-strong px-2.5 py-1.5 text-xs font-medium text-body hover:text-ink"
                      >
                        <Copy size={12} aria-hidden /> 복사
                      </button>
                      <button
                        type="button"
                        onClick={() => bookmarkAnswer(m)}
                        className="inline-flex items-center gap-1.5 rounded-sm bg-strong px-2.5 py-1.5 text-xs font-medium text-body hover:text-ink"
                      >
                        <Bookmark size={12} aria-hidden /> 저장
                      </button>
                    </div>
                  )}

                  {/* 후속 질문 */}
                  {showSuggestions && m.followUps.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.followUps.map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => ask(q)}
                          className="rounded-pill border border-hairline px-3 py-1.5 text-xs text-primary hover:bg-primary/5"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* 생성 중 */}
          {pending && (
            <div className="flex items-center gap-2.5" role="status" aria-live="polite">
              <SymbolBadge size={30} />
              <div className="flex items-center gap-3 rounded-lg rounded-tl-sm bg-soft px-4 py-3">
                <span className="flex items-center gap-1.5" aria-label="답변 생성 중">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-2 w-2 animate-typing rounded-full bg-muted"
                      style={{ animationDelay: `${d * 0.18}s` }}
                    />
                  ))}
                </span>
                <span className="text-xs text-muted">관련 대학 정보를 찾고 있습니다</span>
                <button
                  type="button"
                  onClick={() => {
                    stopRef.current = true;
                    setPending(false);
                    setToast("답변 생성을 중지했습니다.");
                  }}
                  className="inline-flex items-center gap-1 rounded-sm bg-strong px-2 py-1 text-[11px] font-semibold text-ink hover:bg-hairline"
                >
                  <Square size={10} aria-hidden /> 중지
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 입력창 */}
        <form
          className="border-t border-hairline-soft p-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <div className="flex items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">
              질문 입력
            </label>
            <textarea
              id="chat-input"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={MAX_LEN}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  ask(input);
                }
              }}
              placeholder="학사, 장학금, 비교과, 대학 생활정보를 질문해 보세요."
              className="max-h-32 min-h-[46px] w-full resize-none rounded-md border border-hairline bg-surface px-4 py-2.5 text-[15px] text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none"
            />
            {input && (
              <button
                type="button"
                aria-label="입력 내용 삭제"
                onClick={() => setInput("")}
                className="flex h-11 w-9 shrink-0 items-center justify-center rounded-md text-muted hover:bg-soft hover:text-ink"
              >
                <X size={16} aria-hidden />
              </button>
            )}
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="질문 보내기"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-active disabled:bg-primary-disabled"
            >
              <SendHorizonal size={18} aria-hidden />
            </button>
          </div>
          <p className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
            <span>주민등록번호, 비밀번호, 계좌번호 등 민감한 개인정보는 입력하지 마세요.</span>
            <span aria-live="polite">{input.length}/{MAX_LEN}</span>
          </p>
        </form>
      </section>

      {/* 우: 출처 패널 (데스크톱) */}
      <aside className="hidden min-h-0 lg:block" aria-label="답변 출처">
        <div className="max-h-full overflow-y-auto rounded-lg border border-hairline bg-surface p-4 thin-scroll">
          <h2 className="text-sm font-semibold text-ink">답변 출처</h2>
          {lastAssistant && lastAssistant.sources.length > 0 ? (
            <>
              <ul className="mt-3 space-y-2">
                {lastAssistant.sources.map((s) => (
                  <li key={s.id}>
                    <SourceRow source={s} detailed />
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-md bg-soft px-3 py-2.5 text-[11px] leading-relaxed text-muted">
                Chatmore의 답변은 제공된 대학 자료를 기반으로 생성됩니다. 중요한
                신청 및 행정 업무는 반드시 공식 원문과 담당 부서를 확인해 주세요.
              </p>
            </>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-muted">
              답변을 받으면 이곳에 사용된 공식 자료, 담당 부서, 게시일과 원문
              링크가 표시됩니다.
            </p>
          )}
        </div>
      </aside>

      {/* 모바일 출처 바텀시트 */}
      {sheetOpen && lastAssistant && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="답변 출처">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 bg-black/40"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[75dvh] animate-slideUp overflow-y-auto rounded-t-lg bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-hairline" aria-hidden />
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">답변 출처</h2>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setSheetOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-soft"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {lastAssistant.sources.map((s) => (
                <li key={s.id}>
                  <SourceRow source={s} detailed />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 부정 평가 사유 모달 */}
      {feedbackFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="부정 평가 사유">
          <button
            type="button"
            aria-label="닫기"
            className="absolute inset-0 bg-black/40"
            onClick={() => setFeedbackFor(null)}
          />
          <div className="relative w-full max-w-sm rounded-t-lg bg-surface p-5 sm:rounded-lg">
            <h2 className="text-base font-semibold text-ink">
              어떤 점이 아쉬웠나요?
            </h2>
            <p className="mt-1 text-xs text-body">선택한 사유는 답변 품질 개선에 활용됩니다.</p>
            <ul className="mt-4 space-y-1.5">
              {NOT_HELPFUL_REASONS.map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => sendFeedback(feedbackFor, "not_helpful", r)}
                    className="w-full rounded-md border border-hairline px-4 py-2.5 text-left text-sm text-ink hover:border-primary"
                  >
                    {r}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setFeedbackFor(null)}
              className="mt-4 w-full rounded-md bg-strong px-4 py-2.5 text-sm font-semibold text-ink hover:bg-hairline"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {toast && (
        <p role="status" className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-ink px-5 py-2.5 text-sm text-white shadow-lift">
          {toast}
        </p>
      )}
    </div>
  );
}

function SourceRow({ source, detailed }: { source: SourceItem; detailed?: boolean }) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block truncate text-xs font-semibold text-ink">{source.title}</span>
          <span className="mt-0.5 block text-[11px] text-muted">
            {source.department} · 게시일 {source.publishedAt ?? "-"}
          </span>
        </span>
        {source.sourceUrl && (
          <ExternalLink size={12} className="mt-0.5 shrink-0 text-muted" aria-hidden />
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        {source.status && <StatusBadge status={source.status} />}
      </div>
      {detailed && source.excerpt && (
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-body">
          {source.excerpt}
        </p>
      )}
    </>
  );
  const href = safeHttpUrl(source.sourceUrl);
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="block rounded-md border border-hairline p-3 hover:border-primary"
      >
        {inner}
      </a>
    );
  }
  return <div className="rounded-md border border-hairline p-3">{inner}</div>;
}
