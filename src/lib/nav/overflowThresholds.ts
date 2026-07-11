// ナビの末端セクションをドットメニューへ退避するしきい値。
// ナビ項目数はビルド時に確定しているため、しきい値は静的な media query として列挙できる
// (JS 計測が不要になり、SSG のプリレンダー HTML だけで正しい表示になる)。
// IconNav / MobileBottomNav は StyleX の制約 (同一ファイルのフラットな文字列 const) で
// 同じ文字列をリテラルに持つ。テストが本モジュールの出力との一致を検証し、乖離を防ぐ。

// モバイルのタップ最小幅。ボトムバーのタブ 1 個に確保する。
export const MIN_TAB_WIDTH_PX = 56;

/**
 * MobileBottomNav でセクション index (0-based、NAV_SECTIONS 基準) を隠す media query。
 * タブは flexGrow: 1 の等分割。セクション index が末端になるのは 0..index の
 * (index+1) セクション + ドットトリガーの (index+2) タブ構成のときで、
 * 1 タブ幅が 56px 以下になる条件は vw ≤ 56×(index+2)。
 */
export function mobileHideQuery(index: number): string {
  return `@media (max-width: ${MIN_TAB_WIDTH_PX * (index + 2)}px)`;
}

// IconNav レールの寸法 (navChrome.iconButton の 44px 角、レールの gap 16px / paddingBlock 12px×2)。
const RAIL_BUTTON_PX = 44;
const RAIL_GAP_PX = 16;
const RAIL_PADDING_PX = 24;

/**
 * IconNav でセクション index (0-based、NAV_SECTIONS 基準) を隠す media query。
 * セクション S 個表示時のレール所要高 =
 *   padding 24 + ボタン 44×(S+3) + gap 16×(S+4) = 60S + 220
 * (+3 は検索・ドットトリガー・テーマトグル。gap は spacer 2 つを含む S+5 子要素の間)。
 * セクション index が末端になるのは S = index+1 のときで、各ボタンが 44px を
 * 確保できなくなる vh ≤ 60×(index+1) + 220 で隠す。
 */
export function desktopHideQuery(index: number): string {
  const sections = index + 1;
  const requiredPx =
    RAIL_PADDING_PX + RAIL_BUTTON_PX * (sections + 3) + RAIL_GAP_PX * (sections + 4);
  return `@media (max-height: ${requiredPx}px)`;
}
