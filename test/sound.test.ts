import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getSoundStatus, setSoundStatus, playTone } from "../index.js";

describe("TUI Sound Extension", () => {
  it("manages sound enabled toggle", () => {
    setSoundStatus(false);
    assert.equal(getSoundStatus(), false);

    setSoundStatus(true);
    assert.equal(getSoundStatus(), true);
  });

  it("handles playTone without crashing when disabled", () => {
    setSoundStatus(false);
    assert.doesNotThrow(() => {
      playTone(520, 50);
    });
    setSoundStatus(true);
  });
});
