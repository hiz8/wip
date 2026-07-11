/**
 * prerender 出力のパスセグメントを、静的ホスティングが照合に使うデコード形へ変換する。
 *
 * TanStack Start の prerender は crawlLinks で発見したページを href のエンコード形の
 * ままディレクトリ名として書き出す (例: `Version%20Skew/index.html`)。一方
 * Cloudflare Workers Static Assets はリクエストパスを一度 percent-decode してから
 * アセットを照合するため、literal な `%20` を含むファイル名には一致せず 404 になる。
 * dist 上の名前をデコード形へリネームすることで両者を一致させる。
 *
 * @returns リネーム後の名前。リネーム不要 (デコードで変化しない)、またはデコードが
 *   安全でない場合は null。
 *   - 不正な percent シーケンス (URIError) は、URL 由来ではない素の `%` を含む
 *     ファイル名を壊さないため null
 *   - デコード結果がパス構造を変えるもの (`/` `\` を含む、`.` `..`、空文字) は null
 */
export function decodeAssetSegment(name: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(name);
  } catch {
    return null;
  }
  if (decoded === name) return null;
  if (decoded === "" || decoded === "." || decoded === "..") return null;
  if (decoded.includes("/") || decoded.includes("\\")) return null;
  return decoded;
}
