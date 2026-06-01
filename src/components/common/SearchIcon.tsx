interface SearchIconProps {
  size?: number;
}

export function SearchIcon({ size = 20 }: SearchIconProps) {
  return (
    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- currentColor 追従のインライン SVG は <img> 不可、aria-label 付き role="img" が正しい
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Search">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
