import { authHeaders } from "@/lib/backend";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type ApproveResponse = {
  generation_id: string;
  agent_type: "content";
  previous_status: "approval_required";
  status: "approved";
  approval_required: boolean;
  updated_at: string;
};

export type RejectResponse = {
  generation_id: string;
  agent_type: "content";
  previous_status: "approval_required";
  status: "rejected";
  approval_required: boolean;
  updated_at: string;
};

export type PublishResponse = {
  generation_id: string;
  previous_status: "approved";
  status: "published";
  published: boolean;
  updated_at: string;
};

async function parseResponse<T>(response: Response, fallbackDetail: string): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : fallbackDetail;
    throw new Error(detail);
  }
  return payload as T;
}

export async function approveGeneration({
  accessToken,
  generationId,
  note,
  fetchImpl = fetch,
}: {
  accessToken: string;
  generationId: string;
  note?: string;
  fetchImpl?: typeof fetch;
}): Promise<ApproveResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/approvals/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      generation_id: generationId,
      note,
    }),
  });

  return parseResponse<ApproveResponse>(response, "Approve request failed");
}

export async function rejectGeneration({
  accessToken,
  generationId,
  reason,
  fetchImpl = fetch,
}: {
  accessToken: string;
  generationId: string;
  reason?: string;
  fetchImpl?: typeof fetch;
}): Promise<RejectResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/approvals/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      generation_id: generationId,
      reason,
    }),
  });

  return parseResponse<RejectResponse>(response, "Reject request failed");
}

export async function publishGeneration({
  accessToken,
  generationId,
  fetchImpl = fetch,
}: {
  accessToken: string;
  generationId: string;
  fetchImpl?: typeof fetch;
}): Promise<PublishResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/approvals/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      generation_id: generationId,
    }),
  });

  return parseResponse<PublishResponse>(response, "Publish request failed");
}
