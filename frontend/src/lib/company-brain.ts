import { authHeaders } from "@/lib/backend";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type MemoryDocument = {
  id: string;
  file_name: string;
  source_label?: string;
  vector_id: string;
  created_at?: string;
};

export type MemorySearchItem = {
  text: string;
  file_name: string;
  source_label: string;
  document_id: string;
  vector_id: string;
  score?: number | null;
};

export type FounderIntelligenceResponse = {
  profile: {
    startup_name: string;
    mission: string;
    positioning: string;
    audience: string;
    tone: string;
    competitors: string[];
    goals: string[];
    keywords: string[];
  };
  insights: string[];
  suggested_actions: Array<{
    id: string;
    label: string;
    prompt: string;
    reason: string;
  }>;
  knowledge_graph: {
    nodes: Array<{
      id: string;
      label: string;
      kind: "memory" | "strategy" | "output";
    }>;
    edges: Array<{
      from: string;
      to: string;
    }>;
  };
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : "Request failed";
    throw new Error(detail);
  }

  return payload as T;
}

export async function uploadMemoryDocument({
  accessToken,
  file,
  sourceLabel,
  fetchImpl = fetch,
}: {
  accessToken: string;
  file: File;
  sourceLabel: string;
  fetchImpl?: typeof fetch;
}): Promise<{ document_id: string; vector_id: string; file_name: string; source_label: string; chunks_indexed: number }> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("source_label", sourceLabel);

  const response = await fetchImpl(`${backendBaseUrl}/memory/upload`, {
    method: "POST",
    headers: {
      ...authHeaders(accessToken),
    },
    body: formData,
  });

  return parseResponse(response);
}

export async function searchMemoryChunks({
  accessToken,
  query,
  topK,
  fetchImpl = fetch,
}: {
  accessToken: string;
  query: string;
  topK: number;
  fetchImpl?: typeof fetch;
}): Promise<{ items: MemorySearchItem[] }> {
  const response = await fetchImpl(`${backendBaseUrl}/memory/search`, {
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

  return parseResponse(response);
}

export async function listMemoryDocuments({
  accessToken,
  fetchImpl = fetch,
}: {
  accessToken: string;
  fetchImpl?: typeof fetch;
}): Promise<{ items: MemoryDocument[] }> {
  const response = await fetchImpl(`${backendBaseUrl}/memory/list`, {
    method: "GET",
    headers: {
      ...authHeaders(accessToken),
    },
  });

  return parseResponse(response);
}

export async function getFounderIntelligence({
  accessToken,
  fetchImpl = fetch,
}: {
  accessToken: string;
  fetchImpl?: typeof fetch;
}): Promise<FounderIntelligenceResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/memory/profile`, {
    method: "GET",
    headers: {
      ...authHeaders(accessToken),
    },
  });

  return parseResponse(response);
}
