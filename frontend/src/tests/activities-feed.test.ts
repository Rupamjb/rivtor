import { describe, expect, it, vi } from "vitest";

import { listActivitiesFeed } from "@/lib/activities-feed";


describe("activities feed API client", () => {
  it("loads feed with bearer token", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ id: "act-1", event_type: "content_draft_created", metadata: {}, created_at: "2026-05-11T12:00:00Z" }] }),
    });

    const response = await listActivitiesFeed({
      accessToken: "token",
      limit: 10,
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/activities/feed?limit=10");
    expect(options.headers.Authorization).toBe("Bearer token");
    expect(response.items).toHaveLength(1);
  });

  it("throws backend detail on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ detail: "Activity feed unavailable" }),
    });

    await expect(
      listActivitiesFeed({
        accessToken: "token",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow("Activity feed unavailable");
  });
});
