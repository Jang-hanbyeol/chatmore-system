import sanitizeHtml from "sanitize-html";

/**
 * 관리자 작성 공지 본문 HTML 정화.
 * 관리자 폼이 안내하는 태그(+ 기본 서식)만 남기고 script·이벤트 속성·javascript: 링크를 제거한다.
 * 저장 시점이 아닌 렌더 시점에 적용해 기존 데이터에도 효과가 있다.
 */
export function sanitizeNoticeHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "ul", "ol", "li",
      "strong", "b", "em", "i", "a", "blockquote",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noreferrer noopener",
      }),
    },
  });
}

export { safeHttpUrl } from "./url";
