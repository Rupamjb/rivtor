import { describe, expect, it, vi } from "vitest";

import { runResearchAgent } from "@/lib/research-agent";


describe("research agent API client", () => {
  it("posts research query with auth header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generation_id: "gen-1", agent_type: "research", summary: "ok" }),
    });

    await runResearchAgent({
      accessToken: "token",
      query: "startup competitor trends",
      topK: 4,
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/agents/research");
    expect(options.headers.Authorization).toBe("Bearer token");
    expect(options.body).toContain('"top_k":4');
  });

  it("throws backend detail when request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ detail: "Web search unavailable" }),
    });

    await expect(
      runResearchAgent({
        accessToken: "token",
        query: "market trends",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow("Web search unavailable");
  });
});
