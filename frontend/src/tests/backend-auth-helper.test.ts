import { describe, expect, it, vi } from "vitest";

import { authHeaders, backendLogout } from "@/lib/backend";


describe("backend auth helper", () => {
  it("builds bearer headers from access token", () => {
    expect(authHeaders("token-123")).toEqual({ Authorization: "Bearer token-123" });
    expect(authHeaders("")).toEqual({});
  });

  it("logout call is best-effort and never throws", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network fail"));
    await expect(backendLogout("token-123", fetchMock)).resolves.toBeUndefined();
  });
});
