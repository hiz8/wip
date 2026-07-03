import type { ContentType } from "@/types/content.ts";
import { Icon } from "@/components/common/Icon.tsx";

interface ContentTypeIconProps {
  type: ContentType;
  size?: number;
}
export function ContentTypeIcon({ type, size = 20 }: ContentTypeIconProps) {
  switch (type) {
    case "notes":
      return <Icon type="notebook" size={size} />;
    case "glossary":
      return <Icon type="notes" size={size} />;
    case "books":
      return <Icon type="book" size={size} />;
    default:
      return null as never;
  }
}
