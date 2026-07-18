export const MAX_INTERESTS = 10;
export const MAX_INTEREST_LENGTH = 30;
export const MIN_INTEREST_LENGTH = 2;

const SAFE_INTEREST = /^[\p{L}\p{N}][\p{L}\p{N} _.&'+-]{0,29}$/u;

export function normalizeInterestLabel(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function normalizeInterestKey(raw: string): string {
  return normalizeInterestLabel(raw).toLowerCase();
}

export function toInterestSlug(raw: string): string {
  return normalizeInterestKey(raw)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export type InterestValidation =
  | { ok: true; label: string; slug: string }
  | { ok: false; error: string };

export function validateInterest(
  raw: string,
  existing: string[]
): InterestValidation {
  const label = normalizeInterestLabel(raw);
  if (label.length < MIN_INTEREST_LENGTH) {
    return { ok: false, error: `Interest must be at least ${MIN_INTEREST_LENGTH} characters.` };
  }
  if (label.length > MAX_INTEREST_LENGTH) {
    return { ok: false, error: `Interest must be at most ${MAX_INTEREST_LENGTH} characters.` };
  }
  if (!SAFE_INTEREST.test(label)) {
    return { ok: false, error: "Use letters, numbers, and simple punctuation only." };
  }

  const key = normalizeInterestKey(label);
  const duplicate = existing.some((item) => normalizeInterestKey(item) === key);
  if (duplicate) {
    return { ok: false, error: "That interest is already selected." };
  }
  if (existing.length >= MAX_INTERESTS) {
    return { ok: false, error: `You can select up to ${MAX_INTERESTS} interests.` };
  }

  const slug = toInterestSlug(label);
  if (!slug) {
    return { ok: false, error: "Interest is not valid." };
  }

  return { ok: true, label, slug };
}

export const PRESET_INTERESTS = [
  "gaming",
  "music",
  "sports",
  "art",
  "tech",
  "travel",
  "movies",
  "books",
  "cooking",
  "fitness",
  "photography",
  "anime",
] as const;
