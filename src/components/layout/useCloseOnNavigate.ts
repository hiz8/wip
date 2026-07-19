import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

// パスが変わるたびに close() を呼ぶ。同一ルートの兄弟遷移 (例 /notes/a → /notes/b) では
// AppShell が保持され drawerOpen が残るため、明示的に閉じる必要がある。
// close は呼び出し側で安定 (useCallback) させる。mount 時にも 1 度呼ばれるが、その時点では
// ドロワーは閉じているため無害。
export function useCloseOnNavigate(close: () => void): void {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    close();
  }, [pathname, close]);
}
