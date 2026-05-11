import { authHeaders } from "@/lib/backend";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type ActivityFeedItem = {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function listActivitiesFeed({
  accessToken,
  limit = 20,
  fetchImpl = fetch,
}: {
  accessToken: string;
  limit?: number;
  fetchImpl?: typeof fetch;
}): Promise<{ items: ActivityFeedItem[] }> {
  const response = await fetchImpl(`${backendBaseUrl}/activities/feed?limit=${limit}`, {
    method: "GET",
    headers: {
      ...authHeaders(accessToken),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : "Activity feed unavailable";
    throw new Error(detail);
  }

  return payload as { items: ActivityFeedItem[] };
}
