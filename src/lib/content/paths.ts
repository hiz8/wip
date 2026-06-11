// Vault root 相対の filePath を正規化してセグメント分割する
// (先頭スラッシュ除去 + バックスラッシュを "/" に統一)。
// ツリー構築とパンくずの親フォルダ表示が同じ規則を共有する。
export function vaultPathSegments(filePath: string): string[] {
  return filePath.replace(/^\/+/u, "").replaceAll("\\", "/").split("/").filter(Boolean);
}

// filePath (Vault root 相対) から直近の親フォルダ名を取り出す。Vault 直下は null。
export function parentFolderName(filePath: string): string | null {
  const segments = vaultPathSegments(filePath);
  return segments.length > 1 ? (segments.at(-2) ?? null) : null;
}
