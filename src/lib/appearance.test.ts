import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_APPEARANCE, parseAppearance } from "./appearance";

describe("appearance settings parsing", () => {
  it("returns defaults for empty input", () => {
    assert.deepEqual(parseAppearance(null), DEFAULT_APPEARANCE);
  });

  it("merges valid partial settings", () => {
    const parsed = parseAppearance({ density: "compact", fontStyle: "modern" });
    assert.equal(parsed.density, "compact");
    assert.equal(parsed.fontStyle, "modern");
    assert.equal(parsed.videoLayout, DEFAULT_APPEARANCE.videoLayout);
  });

  it("falls back invalid fields without wiping others", () => {
    const parsed = parseAppearance({
      density: "compact",
      fontStyle: "not-a-font",
      animationLevel: "none",
      localVideoSize: "huge",
    });
    assert.equal(parsed.density, "compact");
    assert.equal(parsed.fontStyle, DEFAULT_APPEARANCE.fontStyle);
    assert.equal(parsed.animationLevel, "none");
    assert.equal(parsed.localVideoSize, DEFAULT_APPEARANCE.localVideoSize);
  });

  it("accepts all density, font, animation, layout and chat values", () => {
    const parsed = parseAppearance({
      density: "spacious",
      fontStyle: "system",
      animationLevel: "reduced",
      videoLayout: "partner-focused",
      chatPosition: "left",
      localVideoSize: "large",
    });
    assert.equal(parsed.density, "spacious");
    assert.equal(parsed.fontStyle, "system");
    assert.equal(parsed.animationLevel, "reduced");
    assert.equal(parsed.videoLayout, "partner-focused");
    assert.equal(parsed.chatPosition, "left");
    assert.equal(parsed.localVideoSize, "large");
  });

  it("accepts system animation preference", () => {
    const parsed = parseAppearance({ animationLevel: "system" });
    assert.equal(parsed.animationLevel, "system");
  });

  it("defaults animation preference to system", () => {
    assert.equal(DEFAULT_APPEARANCE.animationLevel, "system");
  });
});
