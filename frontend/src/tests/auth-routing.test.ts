import { describe, expect, it } from "vitest";

import { getStartedDestination } from "@/lib/auth-routing";


describe("getStartedDestination", () => {
  it("routes authenticated users directly to workspace", () => {
    expect(getStartedDestination(true)).toBe("/workspace");
  });

  it("routes guests to login with next target", () => {
    expect(getStartedDestination(false)).toBe("/auth/login?next=/workspace");
  });
});
