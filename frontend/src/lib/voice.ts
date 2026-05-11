import { authHeaders } from "@/lib/backend";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type VoiceTranscriptionResponse = {
  transcript: string;
  provider: "whisper" | "whisper_local";
  model: string;
  language: string | null;
};

export async function transcribeVoice({
  accessToken,
  file,
  fetchImpl = fetch,
}: {
  accessToken: string;
  file: File;
  fetchImpl?: typeof fetch;
}): Promise<VoiceTranscriptionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchImpl(`${backendBaseUrl}/voice/transcribe`, {
    method: "POST",
    headers: {
      ...authHeaders(accessToken),
    },
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : "Voice transcription failed";
    throw new Error(detail);
  }

  return payload as VoiceTranscriptionResponse;
}
