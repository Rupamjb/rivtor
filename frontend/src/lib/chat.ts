import { authHeaders } from "@/lib/backend";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type ChatCitation = {
  source_label: string;
  file_name: string;
  vector_id?: string;
  score?: number | null;
  text_excerpt?: string;
};

export type ChatHistoryTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ChatStreamEvent =
  | { type: "status"; stage: "retrieving_memory" | "generating_response" | "preparing_output" }
  | { type: "token"; token: string }
  | { type: "citations"; items: ChatCitation[] }
  | { type: "done"; chat_id?: string; agent_type?: string }
  | { type: "error"; detail: string };


function parseLineEvent(line: string): ChatStreamEvent {
  const parsed = JSON.parse(line) as ChatStreamEvent;
  if (!parsed || typeof parsed !== "object" || !("type" in parsed)) {
    throw new Error("Invalid chat stream event payload");
  }
  return parsed;
}


export async function streamChatQuery({
  accessToken,
  query,
  agentType = "executive",
  history = [],
  topK = 3,
  onEvent,
  fetchImpl = fetch,
}: {
  accessToken: string;
  query: string;
  agentType?: string;
  history?: ChatHistoryTurn[];
  topK?: number;
  onEvent: (event: ChatStreamEvent) => void;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const response = await fetchImpl(`${backendBaseUrl}/chat/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      query,
      agent_type: agentType,
      history,
      top_k: topK,
    }),
  });

  if (!response.ok) {
    let detail = "Chat query failed";
    try {
      const payload = await response.json();
      if (payload && typeof payload.detail === "string") {
        detail = payload.detail;
      }
    } catch {
      detail = `Chat query failed with status ${response.status}`;
    }
    throw new Error(detail);
  }

  const body = response.body;
  if (!body) {
    throw new Error("Streaming response body is unavailable");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const rawLine = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (rawLine) {
        onEvent(parseLineEvent(rawLine));
      }

      newlineIndex = buffer.indexOf("\n");
    }
  }

  const trailing = (buffer + decoder.decode()).trim();
  if (trailing) {
    onEvent(parseLineEvent(trailing));
  }
}
