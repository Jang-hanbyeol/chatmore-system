import { z } from "zod";

export const USER_TYPES = [
  "재학생",
  "신입생",
  "대학원생",
  "복학생",
  "외국인 유학생",
  "교직원",
  "기타",
] as const;

export const INTEREST_OPTIONS = [
  "학사일정",
  "수강신청",
  "장학금",
  "비교과 프로그램",
  "취업",
  "창업",
  "기숙사",
  "통학버스",
  "도서관",
  "학생식당",
  "행사",
  "교내 시설",
] as const;

export const EXPLORE_CATEGORIES: { slug: string; name: string }[] = [
  { slug: "academic", name: "학사정보" },
  { slug: "scholarship", name: "장학금" },
  { slug: "programs", name: "비교과 프로그램" },
  { slug: "campus-life", name: "대학 생활정보" },
  { slug: "facilities", name: "교내 시설·행정" },
];

export const DATA_STATUSES = [
  "draft",
  "active",
  "needs_review",
  "outdated",
  "archived",
  "sync_failed",
] as const;

export const FEEDBACK_STATUSES = [
  "new",
  "reviewing",
  "resolved",
  "data_updated",
  "model_review_required",
  "closed",
] as const;

export const NOT_HELPFUL_REASONS = [
  "정보가 정확하지 않음",
  "최신 정보가 아님",
  "질문과 관련 없음",
  "설명이 이해하기 어려움",
  "출처가 부족함",
  "답변이 완료되지 않음",
  "기타",
] as const;

export const REPORT_TYPES = ["정보 오류", "서비스 오류", "정보 요청", "기타"] as const;

export const loginSchema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export const onboardingSchema = z.object({
  userType: z.enum(USER_TYPES),
  college: z.string().trim().max(50).optional().or(z.literal("")),
  department: z.string().trim().max(50).optional().or(z.literal("")),
  grade: z.string().trim().max(20).optional().or(z.literal("")),
  admissionYear: z.string().trim().max(10).optional().or(z.literal("")),
  interests: z.array(z.string()).max(12),
  notifySchedule: z.boolean(),
  notifyScholarship: z.boolean(),
  notifyProgram: z.boolean(),
  notifyBookmark: z.boolean(),
  notifyRecommend: z.boolean(),
});

export const chatMessageSchema = z.object({
  conversationId: z.string().trim().optional(),
  message: z.string().trim().min(1, "질문을 입력해 주세요.").max(1000),
});

export const feedbackSchema = z.object({
  messageId: z.string().min(1),
  feedbackType: z.enum(["helpful", "not_helpful"]),
  reason: z.string().max(100).optional().or(z.literal("")),
  comment: z.string().max(1000).optional().or(z.literal("")),
});

export const reportSchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  messageId: z.string().optional().or(z.literal("")),
  content: z.string().trim().min(5, "내용을 5자 이상 입력해 주세요.").max(2000),
  contactBack: z.boolean(),
});

export const infoSourceSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(200),
  category: z.string().trim().min(1).max(30),
  summary: z.string().trim().min(1, "요약을 입력해 주세요.").max(300),
  content: z.string().trim().min(1, "본문을 입력해 주세요."),
  department: z.string().trim().min(1, "담당 부서를 입력해 주세요.").max(50),
  targetUsers: z.string().trim().max(100),
  keywords: z.string().trim().max(300).optional().or(z.literal("")),
  sourceUrl: z.string().trim().url("올바른 URL을 입력해 주세요.").optional().or(z.literal("")),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  dataStatus: z.enum(DATA_STATUSES),
  isAiSearchable: z.boolean(),
});

export const noticeSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력해 주세요.").max(200),
  category: z.string().trim().min(1).max(30),
  summary: z.string().trim().min(1, "요약을 입력해 주세요.").max(300),
  content: z.string().trim().min(1, "내용을 입력해 주세요."),
  department: z.string().trim().min(1).max(50),
  targetUsers: z.string().trim().max(100),
  startAt: z.string().optional().or(z.literal("")),
  endAt: z.string().optional().or(z.literal("")),
  sourceUrl: z.string().trim().url("올바른 URL").optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  isPinned: z.boolean(),
});

export const settingsSchema = z.object({
  answerLength: z.enum(["simple", "detailed"]),
  autoExpandSources: z.boolean(),
  showSuggestions: z.boolean(),
  saveHistory: z.boolean(),
  allowPersonalization: z.boolean(),
  fontSize: z.enum(["default", "large", "xlarge"]),
  highContrast: z.boolean(),
  reduceMotion: z.boolean(),
  language: z.enum(["ko", "en"]),
});
