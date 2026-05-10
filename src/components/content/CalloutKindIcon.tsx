import type { CalloutKind } from "@/types/content.ts";

interface CalloutKindIconProps {
  kind: CalloutKind;
  size?: number;
}

const LABELS: Record<CalloutKind, string> = {
  note: "Note",
  quote: "Quote",
  tip: "Tip",
  info: "Info",
  warning: "Warning",
};

export function CalloutKindIcon({ kind, size = 16 }: CalloutKindIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label={LABELS[kind]}
    >
      {kind === "note" ? <NotePath /> : null}
      {kind === "quote" ? <QuotePath /> : null}
      {kind === "tip" ? <TipPath /> : null}
      {kind === "info" ? <InfoPath /> : null}
      {kind === "warning" ? <WarningPath /> : null}
    </svg>
  );
}

function NotePath() {
  return (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16" r="0.9" fill="currentColor" />
    </>
  );
}

function QuotePath() {
  return (
    <path
      d="M7 7h4v4H8c0 2 1 3 3 3v2c-3 0-5-2-5-5zm8 0h4v4h-3c0 2 1 3 3 3v2c-3 0-5-2-5-5z"
      fill="currentColor"
    />
  );
}

function TipPath() {
  return (
    <path
      d="M9 18h6m-5 3h4M12 3a6 6 0 016 6c0 3-2 4-3 6H9c-1-2-3-3-3-6a6 6 0 016-6z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

function InfoPath() {
  return (
    <path
      d="M10 14l-2 2a3 3 0 010-4l3-3a3 3 0 014 0M14 10l2-2a3 3 0 010 4l-3 3a3 3 0 01-4 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function WarningPath() {
  return (
    <>
      <path d="M12 4l9 16H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 11v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="17.5" r="0.9" fill="currentColor" />
    </>
  );
}
