import { describe, expect, it } from "vitest";

import { reviewBreakdown, scoreFromOutput } from "./openclaw-review";

describe("openclaw review scoring", () => {
  it("scores higher for expected json-like output", () => {
    const low = scoreFromOutput("failed", "json");
    const high = scoreFromOutput('{"result":"ok","data":"json"}', "json");
    expect(high).toBeGreaterThan(low);
  });

  it("reports must_use_browser checks", () => {
    const breakdown = reviewBreakdown("browser success output", "output", ["must_use_browser"]);
    expect(breakdown.checks.mustUseBrowserSatisfied).toBe(true);
  });
});
