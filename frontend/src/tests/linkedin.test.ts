import { describe, expect, it, vi } from "vitest";

import {
  connectLinkedIn,
  publishLinkedIn,
  linkedinConnectionStatus,
} from "@/lib/linkedin";


describe("linkedin API client", () => {
  it("starts linkedin connect flow", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        step: "start",
        connection_status: "pending",
        authorization_url: "https://www.linkedin.com/oauth/v2/authorization?state=s1",
        state: "s1",
        connected_at: null,
      }),
    });

    const result = await connectLinkedIn({
      accessToken: "token",
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/linkedin/connect");
    expect(options.body).toContain('"step":"start"');
    expect(result.connection_status).toBe("pending");
  });

  it("completes linkedin connect flow", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        step: "complete",
        connection_status: "connected",
        linkedin_member_urn: "urn:li:person:member-1",
        connected_at: "2026-05-11T13:00:00Z",
      }),
    });

    await connectLinkedIn({
      accessToken: "token",
      step: "complete",
      code: "oauth-code",
      state: "oauth-state",
      fetchImpl: fetchMock,
    });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toContain('"step":"complete"');
    expect(options.body).toContain('"code":"oauth-code"');
    expect(options.body).toContain('"state":"oauth-state"');
  });

  it("loads linkedin connection status", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        step: "status",
        connection_status: "connected",
        linkedin_member_urn: "urn:li:person:member-1",
        connected_at: "2026-05-11T13:00:00Z",
      }),
    });

    const result = await linkedinConnectionStatus({
      accessToken: "token",
      fetchImpl: fetchMock,
    });

    expect(result.connection_status).toBe("connected");
  });

  it("publishes approved draft to linkedin", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        generation_id: "gen-1",
        status: "published",
        channel: "linkedin",
        linkedin_post_urn: "urn:li:share:post-1",
        linkedin_post_url: "https://www.linkedin.com/feed/update/urn:li:share:post-1",
        published_at: "2026-05-11T14:00:00Z",
      }),
    });

    const response = await publishLinkedIn({
      accessToken: "token",
      generationId: "gen-1",
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/linkedin/publish");
    expect(options.body).toContain('"generation_id":"gen-1"');
    expect(response.channel).toBe("linkedin");
  });

  it("throws backend detail for publish failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ detail: "LinkedIn rate limited" }),
    });

    await expect(
      publishLinkedIn({
        accessToken: "token",
        generationId: "gen-1",
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow("LinkedIn rate limited");
  });
});
