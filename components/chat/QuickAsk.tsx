"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/** 홈 대시보드 빠른 질문 입력창 — 제출 시 챗봇 화면으로 이동 */
export function QuickAsk({ quickQuestions }: { quickQuestions: string[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go(question: string) {
    const q = question.trim();
    if (!q) {
      router.push("/chat");
      return;
    }
    router.push(`/chat?q=${encodeURIComponent(q)}`);
  }

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        className="flex gap-2"
      >
        <label htmlFor="quick-ask" className="sr-only">
          질문 입력
        </label>
        <input
          id="quick-ask"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="무엇을 찾고 계신가요?"
          className="h-12 w-full rounded-md border border-hairline bg-surface px-4 text-[15px] text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          className="flex h-12 shrink-0 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-white hover:bg-primary-active"
        >
          <Search size={17} aria-hidden />
          <span className="hidden sm:inline">질문하기</span>
        </button>
      </form>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 thin-scroll">
        {quickQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => go(q)}
            className="shrink-0 rounded-pill border border-hairline bg-surface px-3.5 py-1.5 text-[13px] text-body hover:border-primary hover:text-primary"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
