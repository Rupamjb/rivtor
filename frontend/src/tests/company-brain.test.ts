import { describe, expect, it, vi } from "vitest";

import {
  listMemoryDocuments,
  searchMemoryChunks,
  uploadMemoryDocument,
} from "@/lib/company-brain";


describe("company brain API client", () => {
  it("uploads a file with source label", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ document_id: "doc-1" }),
    });

    const file = new File(["founder text"], "founder-notes.txt", { type: "text/plain" });
    await uploadMemoryDocument({
      accessToken: "token",
      file,
      sourceLabel: "Founder Notes",
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer token");
  });

  it("searches memory chunks with top-k", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ text: "summary" }] }),
    });

    const result = await searchMemoryChunks({
      accessToken: "token",
      query: "investor update",
      topK: 4,
      fetchImpl: fetchMock,
    });

    expect(result.items[0].text).toBe("summary");
    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toContain('"top_k":4');
  });

  it("lists memory documents", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ id: "doc-1", file_name: "founder-notes.txt" }] }),
    });

    const result = await listMemoryDocuments({ accessToken: "token", fetchImpl: fetchMock });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].file_name).toBe("founder-notes.txt");
  });
});
