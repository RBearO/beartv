import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_INTERESTS,
  normalizeInterestKey,
  normalizeInterestLabel,
  toInterestSlug,
  validateInterest,
} from "./interests";

describe("interest normalization", () => {
  it("trims and collapses whitespace", () => {
    assert.equal(normalizeInterestLabel("  Video   Games  "), "Video Games");
    assert.equal(normalizeInterestKey("  Gaming "), "gaming");
  });

  it("builds stable slugs", () => {
    assert.equal(toInterestSlug("Video Games"), "video-games");
    assert.equal(toInterestSlug("GAMING"), "gaming");
  });

  it("accepts a valid custom interest", () => {
    const result = validateInterest("Video Games", []);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.label, "Video Games");
      assert.equal(result.slug, "video-games");
    }
  });

  it("rejects duplicates case-insensitively", () => {
    const result = validateInterest("gaming", ["Gaming"]);
    assert.equal(result.ok, false);
  });

  it("rejects interests that are too short or too long", () => {
    assert.equal(validateInterest("a", []).ok, false);
    assert.equal(validateInterest("x".repeat(31), []).ok, false);
  });

  it("enforces the maximum interest count", () => {
    const existing = Array.from({ length: MAX_INTERESTS }, (_, i) => `Tag ${i}`);
    const result = validateInterest("Extra", existing);
    assert.equal(result.ok, false);
  });

  it("rejects punctuation-only values", () => {
    assert.equal(validateInterest("...", []).ok, false);
    assert.equal(validateInterest("!!", []).ok, false);
  });

  it("keeps HTML-like input as plain text labels", () => {
    const result = validateInterest("<script>x", []);
    assert.equal(result.ok, false);
  });
});
