/** AI API 인터페이스 타입 (스펙 §38) — Mock 과 실제 API 가 동일 구조를 사용 */

export type ChatRequest = {
  conversationId?: string;
  message: string;
  userContext?: {
    userType?: string;
    department?: string;
    grade?: string;
    interests?: string[];
  };
};

export type SourceItem = {
  id: string;
  title: string;
  category?: string;
  department?: string;
  publishedAt?: string;
  updatedAt?: string;
  sourceUrl?: string;
  excerpt?: string;
  attachmentUrl?: string;
  status?: "official" | "outdated" | "review_required";
};

export type RelatedNotice = {
  id: string;
  title: string;
  category: string;
  department: string;
  publishedAt?: string;
  endAt?: string | null;
};

export type ChatResponse = {
  conversationId: string;
  answerId: string;
  answer: string;
  summary?: string;
  sources: SourceItem[];
  relatedNotices?: RelatedNotice[];
  followUpQuestions?: string[];
  generatedAt: string;
  dataCheckedAt?: string;
  status: "success" | "partial" | "no_result" | "error";
  isDemo?: boolean;
};
