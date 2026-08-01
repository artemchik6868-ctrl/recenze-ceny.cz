/** Re-export production prompts for smoke scripts. */
export {
  REVIEW_GEN_SYSTEM_CS,
  buildReviewGenUserCs,
  alignStoredReviews,
  type ReviewGenProduct,
  type StoredReview,
} from "../../src/lib/review-gen-prompt.cs.ts";
export type { ReviewSlotSpec as ReviewGenSlot } from "../../src/lib/review-slots-gen.ts";
