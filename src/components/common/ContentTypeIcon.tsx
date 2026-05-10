import type { ContentType } from "@/types/content.ts";

interface ContentTypeIconProps {
  type: ContentType;
  size?: number;
}

const LABELS: Record<ContentType, string> = {
  notes: "Note",
  glossary: "Glossary",
  books: "Book",
};

export function ContentTypeIcon({ type, size = 20 }: ContentTypeIconProps) {
  const label = LABELS[type];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label={label}>
      {type === "notes" ? <NotesPath /> : null}
      {type === "glossary" ? <GlossaryPath /> : null}
      {type === "books" ? <BooksPath /> : null}
    </svg>
  );
}

function NotesPath() {
  return (
    <>
      <path
        d="M6 3h9l5 5v13H6zM15 3v5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 13h7M9 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>
  );
}

function GlossaryPath() {
  return (
    <>
      <path
        d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 17h14" stroke="currentColor" strokeWidth="1.6" />
    </>
  );
}

function BooksPath() {
  return (
    <>
      <rect x="4" y="4" width="5" height="16" stroke="currentColor" strokeWidth="1.6" />
      <rect x="10" y="4" width="5" height="16" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 5l4 1-3 15-4-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </>
  );
}
