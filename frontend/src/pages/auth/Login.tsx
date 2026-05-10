import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";


export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/workspace" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await signIn(email, password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    navigate(from || "/workspace", { replace: true });
  };

  return (
    <main className="bg-rv text-rv-text relative min-h-screen overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div className="mx-auto relative flex min-h-screen max-w-5xl items-center px-6 py-16">
        <section className="hairline bg-rv-2 w-full p-8 sm:p-10">
          <p className="label-eyebrow text-rv-dim">FounderOS Auth</p>
          <h1 className="font-display mt-5 text-4xl leading-tight sm:text-5xl">Welcome back</h1>
          <p className="text-rv-dim mt-3 max-w-xl text-sm">Access your AI operations workspace.</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <Input
              type="email"
              value={email}
              placeholder="founder@startup.com"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Input
              type="password"
              value={password}
              placeholder="Your password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <p className="text-sm text-red-400">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-rv-dim mt-6 text-sm">
            New here? <Link className="text-rv-text underline" to="/auth/signup">Create an account</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
