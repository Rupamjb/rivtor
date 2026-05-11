"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";


type SignupPageProps = {
  nextPath?: string;
};


export default function SignupPage({ nextPath = "/workspace" }: SignupPageProps) {
  const router = useRouter();
  const { signUp, user } = useAuth();

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

    const result = await signUp(email, password);
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
      title="Create your account"
      description="Set up your founder workspace in seconds."
      footer={
        <>
          Already have an account? <Link className="text-rv-text underline" href="/auth/login">Sign in</Link>
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
          placeholder="Minimum 6 characters"
          minLength={6}
          onChange={(event) => setPassword(event.target.value)}
          className="border-white/15 bg-rv text-rv-text placeholder:text-rv-dim"
          required
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
