interface HomeIconProps {
  size?: number;
}

// ナビのホームアイコン (家のシルエット)。ラベルは呼び出し側 (sr-only span や
// ボトムナビの可視ラベル) が担うため aria-hidden。
export function HomeIcon({ size = 20 }: HomeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
