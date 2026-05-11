import { describe, expect, it, vi } from "vitest";

import { transcribeVoice } from "@/lib/voice";


describe("voice API client", () => {
  it("posts multipart audio to voice transcribe endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        transcript: "Draft the founder update",
        provider: "whisper",
        model: "whisper-1",
        language: "en",
      }),
    });

    const file = new File([new Uint8Array([1, 2, 3])], "note.webm", { type: "audio/webm" });
    const payload = await transcribeVoice({
      accessToken: "token",
      file,
      fetchImpl: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("/voice/transcribe");
    expect(options.method).toBe("POST");
    expect(options.headers.Authorization).toBe("Bearer token");
    expect(options.body).toBeInstanceOf(FormData);
    expect(payload.transcript).toBe("Draft the founder update");
  });

  it("throws backend detail on transcription failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ detail: "Whisper unavailable" }),
    });

    const file = new File([new Uint8Array([1, 2, 3])], "note.webm", { type: "audio/webm" });

    await expect(
      transcribeVoice({
        accessToken: "token",
        file,
        fetchImpl: fetchMock,
      }),
    ).rejects.toThrow("Whisper unavailable");
  });
});
