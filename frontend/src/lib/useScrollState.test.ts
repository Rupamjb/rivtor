import { describe, expect, it } from "vitest";
import * as scrollStateModule from "./useScrollState";

describe("useScrollState module", () => {
  it("exports useScrollState for navbar usage", () => {
    const exported = (scrollStateModule as Record<string, unknown>).useScrollState;
    expect(typeof exported).toBe("function");
  });
});
