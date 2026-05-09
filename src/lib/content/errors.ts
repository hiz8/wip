export type BuildErrorCategory =
  | "config"
  | "invalid-frontmatter"
  | "link-resolution"
  | "image-reference"
  | "slug-collision";

export interface BuildErrorDetails {
  category: BuildErrorCategory;
  filePath?: string | undefined;
  field?: string | undefined;
  message: string;
  cause?: unknown;
}

export class BuildError extends Error {
  readonly category: BuildErrorCategory;
  readonly filePath: string | undefined;
  readonly field: string | undefined;

  constructor(details: BuildErrorDetails) {
    super(formatBuildError(details));
    this.name = "BuildError";
    this.category = details.category;
    this.filePath = details.filePath;
    this.field = details.field;
    if (details.cause !== undefined) {
      this.cause = details.cause;
    }
  }
}

export function formatBuildError(details: BuildErrorDetails): string {
  const parts: string[] = [`[${details.category}]`];
  if (details.filePath) parts.push(details.filePath);
  if (details.field) parts.push(`(field: ${details.field})`);
  parts.push(details.message);
  return parts.join(" ");
}
