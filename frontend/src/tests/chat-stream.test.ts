import { describe, expect, it, vi } from "vitest";

import { streamChatQuery, type ChatStreamEvent } from "@/lib/chat";


function streamFromTextChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}


describe("chat stream client", () => {
  it("parses status, token, citations, and done events", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        streamFromTextChunks([
          '{"type":"status","stage":"retrieving_memory"}\n',
          '{"type":"token","token":"Hello "}\n',
          '{"type":"token","token":"Founder"}\n',
          '{"type":"citations","items":[{"source_label":"Founder Notes","file_name":"notes.txt"}]}\n',
          '{"type":"done","chat_id":"chat-1"}\n',
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/x-ndjson" },
        },
      ),
    );

    const events: ChatStreamEvent[] = [];
    await streamChatQuery({
      accessToken: "token",
      query: "Summarize notes",
      onEvent: (event) => events.push(event),
      fetchImpl: fetchMock,
    });

    expect(events.map((event) => event.type)).toEqual([
      "status",
      "token",
      "token",
      "citations",
      "done",
    ]);
    expect(events[0]).toEqual({ type: "status", stage: "retrieving_memory" });
    expect(events[1]).toEqual({ type: "token", token: "Hello " });
  });

  it("throws clear error when chat request fails", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      streamChatQuery({
        accessToken: "bad-token",
        query: "hello",
        onEvent: () => undefined,
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow("Invalid or expired token");
  });

  it("includes chat history payload when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(streamFromTextChunks(['{"type":"done","chat_id":"chat-1"}\n']), {
        status: 200,
        headers: { "Content-Type": "application/x-ndjson" },
      }),
    );

    await streamChatQuery({
      accessToken: "token",
      query: "Refine this",
      history: [
        { role: "user", content: "Draft launch priorities" },
        { role: "assistant", content: "Focus onboarding first." },
      ],
      onEvent: () => undefined,
      fetchImpl: fetchMock,
    } as any);

    const [, options] = fetchMock.mock.calls[0];
    const payload = JSON.parse(String(options.body));
    expect(payload.history).toEqual([
      { role: "user", content: "Draft launch priorities" },
      { role: "assistant", content: "Focus onboarding first." },
    ]);
  });
});
