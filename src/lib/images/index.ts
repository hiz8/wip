export {
  buildImageMapping,
  buildResolvedToPublicMap,
  hashSuffix,
  isExternalImagePath,
  resolveImageRef,
} from "./resolve.ts";
export type { ImageMappingEntry, ImageMappingResult, ResolveImageRefContext } from "./resolve.ts";
export { rewriteImgSrcInHtml } from "./rewrite.ts";
export { bookCoverToImageRef, lookupBookCoverUrl } from "./cover.ts";
export type { BookCoverContext } from "./cover.ts";
