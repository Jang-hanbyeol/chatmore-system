import { Logo } from "@/components/ui/Logo";

/**
 * 설치형 앱 창의 통합 상단바 (Window Controls Overlay).
 * 일반 브라우저 탭에서는 숨겨지고(display-mode 미디어 쿼리), 앱 창에서만 보인다.
 * 영역 전체가 창 끌기 영역이라 드래그로 창 이동, 더블클릭으로 최대화가 되며
 * 오른쪽의 최소화·최대화·닫기는 OS 기본 버튼이 그대로 표시된다.
 */
export function AppTitleBar() {
  return (
    <div className="app-titlebar" aria-hidden>
      <Logo variant="symbol" height={16} />
      <span className="text-xs font-semibold text-ink">Chatmore</span>
      <span className="text-xs text-muted">· 대학 생활정보 챗봇</span>
    </div>
  );
}
