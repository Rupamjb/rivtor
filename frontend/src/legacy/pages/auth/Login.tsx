"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";


type LoginPageProps = {
  nextPath?: string;
};


export default function LoginPage({ nextPath = "/workspace" }: LoginPageProps) {
  const router = useRouter();
  const { signIn, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/workspace");
    }
  }, [router, user]);

  if (user) {
    return null;
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

    router.replace(nextPath);
  };

  return (
    <AuthShell
      eyebrow="FounderOS Auth"
      title="Welcome back"
      description="Access your AI operations workspace."
      footer={
        <>
          New here? <Link className="text-rv-text underline" href="/auth/signup">Create an account</Link>
        </>
      }
    >
      {!isSupabaseConfigured ? (
        <p className="mb-4 text-sm text-amber-300">
          Supabase auth is not configured. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
        </p>
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          type="email"
          value={email}
          placeholder="founder@startup.com"
          onChange={(event) => setEmail(event.target.value)}
          className="border-white/15 bg-rv text-rv-text placeholder:text-rv-dim"
          required
        />
        <Input
          type="password"
          value={password}
          placeholder="Your password"
          onChange={(event) => setPassword(event.target.value)}
          className="border-white/15 bg-rv text-rv-text placeholder:text-rv-dim"
          required
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}
