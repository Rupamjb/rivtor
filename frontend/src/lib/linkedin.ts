import { authHeaders } from "@/lib/backend";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type LinkedInConnectionStatus = "disconnected" | "pending" | "connected";

export type LinkedInConnectResponse = {
  step: "start" | "complete" | "status";
  connection_status: LinkedInConnectionStatus;
  authorization_url?: string | null;
  state?: string | null;
  linkedin_member_urn?: string | null;
  connected_at?: string | null;
};

export type LinkedInPublishResponse = {
  generation_id: string;
  status: "published";
  channel: "linkedin";
  linkedin_post_urn: string;
  linkedin_post_url: string | null;
  published_at: string;
};

async function parseResponse<T>(response: Response, fallbackDetail: string): Promise<T> {
  const payload = await response.json();
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : fallbackDetail;
    throw new Error(detail);
  }
  return payload as T;
}

export async function connectLinkedIn({
  accessToken,
  step = "start",
  code,
  state,
  forceReconnect = false,
  fetchImpl = fetch,
}: {
  accessToken: string;
  step?: "start" | "complete" | "status";
  code?: string;
  state?: string;
  forceReconnect?: boolean;
  fetchImpl?: typeof fetch;
}): Promise<LinkedInConnectResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/linkedin/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      step,
      code,
      state,
      force_reconnect: forceReconnect,
    }),
  });

  return parseResponse<LinkedInConnectResponse>(response, "LinkedIn connect request failed");
}

export async function linkedinConnectionStatus({
  accessToken,
  fetchImpl = fetch,
}: {
  accessToken: string;
  fetchImpl?: typeof fetch;
}): Promise<LinkedInConnectResponse> {
  return connectLinkedIn({
    accessToken,
    step: "status",
    fetchImpl,
  });
}

export async function publishLinkedIn({
  accessToken,
  generationId,
  fetchImpl = fetch,
}: {
  accessToken: string;
  generationId: string;
  fetchImpl?: typeof fetch;
}): Promise<LinkedInPublishResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/linkedin/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify({
      generation_id: generationId,
    }),
  });

  return parseResponse<LinkedInPublishResponse>(response, "LinkedIn publish request failed");
}
