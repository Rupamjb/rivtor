import { authHeaders } from "@/lib/backend";


const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type StartupRadarResponse = {
  title: string;
  items: string[];
  suggested_action: string;
  sources: Array<{
    title: string;
    url: string;
    source_type: "web" | "memory";
    source_label: string;
    snippet: string;
  }>;
};

export async function getStartupRadar({
  accessToken,
  fetchImpl = fetch,
}: {
  accessToken: string;
  fetchImpl?: typeof fetch;
}): Promise<StartupRadarResponse> {
  const response = await fetchImpl(`${backendBaseUrl}/agents/startup-radar`, {
    method: "GET",
    headers: {
      ...authHeaders(accessToken),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail = typeof payload?.detail === "string" ? payload.detail : "Startup radar unavailable";
    throw new Error(detail);
  }

  return payload as StartupRadarResponse;
}
