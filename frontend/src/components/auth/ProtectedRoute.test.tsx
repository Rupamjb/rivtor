import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi } from "vitest";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthContext, type AuthContextValue } from "@/context/AuthContext";


function renderRouteWithAuth(value: AuthContextValue) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={["/workspace"]}>
        <Routes>
          <Route path="/auth/login" element={<div>Login Screen</div>} />
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <div>Workspace Screen</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}


describe("ProtectedRoute", () => {
  const baseValue: AuthContextValue = {
    user: null,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  };

  it("redirects unauthenticated users to login", () => {
    renderRouteWithAuth(baseValue);
    expect(screen.getByText("Login Screen")).toBeInTheDocument();
  });

  it("renders children for authenticated users", () => {
    renderRouteWithAuth({
      ...baseValue,
      user: { id: "user-1", email: "founder@example.com" },
      session: { access_token: "mock-dev-token" },
    });
    expect(screen.getByText("Workspace Screen")).toBeInTheDocument();
  });
});
