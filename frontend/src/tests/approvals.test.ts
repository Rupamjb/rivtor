import { describe, expect, it, vi } from "vitest";

import { approveGeneration, publishGeneration, rejectGeneration } from "@/lib/approvals";


describe("approvals API client", () => {
  it("posts approve request with generation id and note", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generation_id: "gen-1", status: "approved" }),
    });

    await approveGeneration({
      accessToken: "token",
      generationId: "gen-1",
      note: "ready",
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer token");
    expect(options.body).toContain('"generation_id":"gen-1"');
    expect(options.body).toContain('"note":"ready"');
  });

  it("posts publish request", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generation_id: "gen-1", status: "published", published: true }),
    });

    await publishGeneration({
      accessToken: "token",
      generationId: "gen-1",
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("/approvals/publish");
  });

  it("throws backend detail on reject failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ detail: "Invalid status transition" }),
    });

    await expect(
      rejectGeneration({
        accessToken: "token",
        generationId: "gen-1",
        reason: "needs edits",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow("Invalid status transition");
  });
});
