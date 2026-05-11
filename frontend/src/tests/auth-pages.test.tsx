import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/context/AuthContext";
import LoginPage from "@/legacy/pages/auth/Login";
import SignupPage from "@/legacy/pages/auth/Signup";


const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));


function renderWithAuth(ui: React.ReactNode, value?: Partial<AuthContextValue>) {
  const base: AuthContextValue = {
    user: null,
    session: null,
    loading: false,
    signIn: vi.fn().mockResolvedValue({}),
    signUp: vi.fn().mockResolvedValue({}),
    signOut: vi.fn().mockResolvedValue(undefined),
  };

  return render(<AuthContext.Provider value={{ ...base, ...value }}>{ui}</AuthContext.Provider>);
}


describe("auth pages", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("renders login with constrained auth card width", () => {
    renderWithAuth(<LoginPage />);
    const card = screen.getByTestId("auth-card");
    expect(card.className).toContain("max-w-[460px]");
  });

  it("renders signup with constrained auth card width", () => {
    renderWithAuth(<SignupPage />);
    const card = screen.getByTestId("auth-card");
    expect(card.className).toContain("max-w-[460px]");
  });

  it("redirects signup success to provided next path", async () => {
    const signUp = vi.fn().mockResolvedValue({});
    renderWithAuth(<SignupPage nextPath="/workspace" />, { signUp });

    fireEvent.change(screen.getByPlaceholderText("founder@startup.com"), {
      target: { value: "founder@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Minimum 6 characters"), {
      target: { value: "secure-pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith("founder@example.com", "secure-pass");
      expect(replaceMock).toHaveBeenCalledWith("/workspace");
    });
  });
});
