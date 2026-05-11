import { authHeaders } from "@/lib/backend";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type ContentSource = {
  source_type: "memory" | "research";
  source_label: string;
  title: string;
  snippet: string;
};

export type ContentFormat = "linkedin" | "founder_update" | "launch_post" | "x_post" | "blog_outline";

export type ContentAgentResponse = {
  generation_id: string;
  agent_type: "content";
  status: "approval_required";
  approval_required: boolean;
  query: string;
  format: ContentFormat;
  tone: "professional" | "bold" | "insightful" | "casual";
  length: "short" | "medium" | "long";
  title: string;
  draft: string;
  image_requested?: boolean;
  image_data_url?: string;
  image_error?: string;
  context_labels: string[];
  sources: ContentSource[];
  created_at: string;
};


export async function runContentAgent({
  accessToken,
  query,
  format = "linkedin",
  tone = "professional",
  length = "medium",
  generateImage = true,
  topK = 3,
  fetchImpl = fetch,
}: {
  accessToken: string;
  query: string;
  format?: ContentFormat;
  tone?: "professional" | "bold" | "insightful" | "casual";
  length?: "short" | "medium" | "long";
  generateImage?: boolean;
  topK?: number;
  fetchImpl?: typeof fetch;
}): Promise<ContentAgentResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/agents/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      query,
      format,
      tone,
      length,
      generate_image: generateImage,
      top_k: topK,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : "Content request failed";
    throw new Error(detail);
  }

  return payload as ContentAgentResponse;
}
