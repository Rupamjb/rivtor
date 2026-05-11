import { authHeaders } from "@/lib/backend";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type ResearchSource = {
  title: string;
  url: string;
  source_type: "web" | "memory";
  source_label: string;
  snippet: string;
};

export type ResearchAgentResponse = {
  generation_id: string;
  agent_type: "research";
  query: string;
  summary: string;
  signals: string[];
  risks: string[];
  actions: string[];
  sources: ResearchSource[];
  created_at: string;
};


export async function runResearchAgent({
  accessToken,
  query,
  topK = 3,
  fetchImpl = fetch,
}: {
  accessToken: string;
  query: string;
  topK?: number;
  fetchImpl?: typeof fetch;
}): Promise<ResearchAgentResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/agents/research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      query,
      top_k: topK,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : "Research request failed";
    throw new Error(detail);
  }

  return payload as ResearchAgentResponse;
}
