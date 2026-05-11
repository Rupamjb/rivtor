import { describe, expect, it, vi } from "vitest";

import { runContentAgent } from "@/lib/content-agent";


describe("content agent API client", () => {
  it("posts content generation request with template controls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generation_id: "gen-c1", agent_type: "content", status: "approval_required" }),
    });

    await runContentAgent({
      accessToken: "token",
      query: "write a linkedin launch post",
      format: "linkedin",
      tone: "professional",
      length: "medium",
      topK: 4,
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer token");
    expect(options.body).toContain('"format":"linkedin"');
    expect(options.body).toContain('"tone":"professional"');
    expect(options.body).toContain('"length":"medium"');
    expect(options.body).toContain('"generate_image":true');
  });

  it("allows disabling image generation in payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generation_id: "gen-c2", agent_type: "content", status: "approval_required" }),
    });

    await runContentAgent({
      accessToken: "token",
      query: "write a linkedin launch post",
      format: "linkedin",
      generateImage: false,
      fetchImpl: fetchMock,
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toContain('"generate_image":false');
  });

  it("throws backend detail on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ detail: "Content generation unavailable" }),
    });

    await expect(
      runContentAgent({
        accessToken: "token",
        query: "write launch post",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow("Content generation unavailable");
  });
});
