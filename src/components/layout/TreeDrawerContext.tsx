import { createContext, useContext } from "react";

export interface TreeDrawerContextValue {
  hasTree: boolean;
  open: () => void;
}

const noop = () => {};

// ツリードロワーの開閉をパンくず先頭のトリガー (本文内) と AppShell (ドロワー本体) の
// 間で橋渡しする。Provider を持たないツリーで描画された場合は hasTree=false でトリガー非表示。
export const TreeDrawerContext = createContext<TreeDrawerContextValue>({
  hasTree: false,
  open: noop,
});

export function useTreeDrawer(): TreeDrawerContextValue {
  return useContext(TreeDrawerContext);
}
