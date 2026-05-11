import { authHeaders } from "@/lib/backend";
import type { ContentAgentResponse } from "@/lib/content-agent";
import type { ResearchAgentResponse } from "@/lib/research-agent";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type MultiAgentRouteResponse = {
  route: string[];
  research: ResearchAgentResponse | null;
  content: ContentAgentResponse | null;
  executive: {
    agent_type: "executive";
    query: string;
    response: string;
    citations: Array<{
      source_label: string;
      file_name: string;
      vector_id?: string;
      score?: number | null;
      text_excerpt?: string;
    }>;
  } | null;
  suggested_actions: Array<{
    id: string;
    label: string;
    prompt: string;
    reason: string;
  }>;
};

export async function runMultiAgentRoute({
  accessToken,
  query,
  topK = 3,
  fetchImpl = fetch,
}: {
  accessToken: string;
  query: string;
  topK?: number;
  fetchImpl?: typeof fetch;
}): Promise<MultiAgentRouteResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/agents/multi-route`, {
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
    const detail = typeof payload?.detail === "string" ? payload.detail : "Multi-agent routing unavailable";
    throw new Error(detail);
  }

  return payload as MultiAgentRouteResponse;
}
