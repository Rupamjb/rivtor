import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/context/AuthContext";
import LinkedInCallbackPage from "@/app/integrations/linkedin/callback/page";


const { replaceMock, connectLinkedInMock, getMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  connectLinkedInMock: vi.fn(),
  getMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
  useSearchParams: () => ({
    get: getMock,
  }),
}));

vi.mock("@/lib/linkedin", async () => {
  const actual = await vi.importActual<typeof import("@/lib/linkedin")>("@/lib/linkedin");
  return {
    ...actual,
    connectLinkedIn: connectLinkedInMock,
  };
});


function renderWithAuth(value?: Partial<AuthContextValue>) {
  const base: AuthContextValue = {
    user: { id: "user-1", email: "founder@example.com" },
    session: { access_token: "token" },
    loading: false,
    signIn: vi.fn().mockResolvedValue({}),
    signUp: vi.fn().mockResolvedValue({}),
    signOut: vi.fn().mockResolvedValue(undefined),
  };
  return render(
    <AuthContext.Provider value={{ ...base, ...value }}>
      <LinkedInCallbackPage />
    </AuthContext.Provider>,
  );
}


describe("linkedin callback page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockImplementation((key: string) => {
      if (key === "code") {
        return "oauth-code";
      }
      if (key === "state") {
        return "oauth-state";
      }
      return null;
    });
  });

  it("completes oauth and redirects to workspace", async () => {
    connectLinkedInMock.mockResolvedValue({
      step: "complete",
      connection_status: "connected",
      linkedin_member_urn: "urn:li:person:member-1",
      connected_at: "2026-05-11T13:00:00Z",
    });

    renderWithAuth();

    await waitFor(() => {
      expect(connectLinkedInMock).toHaveBeenCalledWith({
        accessToken: "token",
        step: "complete",
        code: "oauth-code",
        state: "oauth-state",
      });
      expect(replaceMock).toHaveBeenCalledWith("/workspace?linkedin=connected");
    });
  });

  it("shows missing-params error when callback query is incomplete", async () => {
    getMock.mockReturnValue(null);
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("LinkedIn callback is missing code or state.")).toBeInTheDocument();
    });
  });

  it("surfaces oauth provider scope error details", async () => {
    getMock.mockImplementation((key: string) => {
      if (key === "error") {
        return "invalid_scope_error";
      }
      if (key === "error_description") {
        return "The requested permission scope is not valid";
      }
      if (key === "state") {
        return "oauth-state";
      }
      return null;
    });

    renderWithAuth();

    await waitFor(() => {
      expect(
        screen.getByText("LinkedIn authorization failed: The requested permission scope is not valid. Verify LinkedIn app permissions and LINKEDIN_SCOPE."),
      ).toBeInTheDocument();
    });
    expect(connectLinkedInMock).not.toHaveBeenCalled();
  });

  it("shows connect error when completion fails", async () => {
    connectLinkedInMock.mockRejectedValue(new Error("OAuth state mismatch"));
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("OAuth state mismatch")).toBeInTheDocument();
    });
  });
});
