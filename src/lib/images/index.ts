export {
  buildImageMapping,
  buildResolvedToPublicMap,
  hashSuffix,
  isExternalImagePath,
} from "./resolve.ts";
export type { ImageMappingEntry, ImageMappingResult } from "./resolve.ts";
export { rewriteImgSrcInHtml } from "./rewrite.ts";
export { bookCoverToImageRef, lookupBookCoverUrl } from "./cover.ts";
export type { BookCoverContext } from "./cover.ts";
