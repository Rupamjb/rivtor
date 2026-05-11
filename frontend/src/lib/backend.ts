const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function authHeaders(accessToken?: string): Record<string, string> {
  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function backendLogout(
  accessToken?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!accessToken) {
    return;
  }

  try {
    await fetchImpl(`${backendBaseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        ...authHeaders(accessToken),
      },
    });
  } catch {
    return;
  }
}
