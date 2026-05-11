"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { connectLinkedIn } from "@/lib/linkedin";


function LinkedInCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const accessToken = session?.access_token ?? "";
  const [statusText, setStatusText] = useState("Completing LinkedIn connection...");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const oauthError = searchParams?.get("error") ?? "";
    const oauthErrorDescription = searchParams?.get("error_description") ?? "";
    const code = searchParams?.get("code") ?? "";
    const state = searchParams?.get("state") ?? "";

    async function complete() {
      if (!accessToken) {
        setErrorText("Sign in required to complete LinkedIn connection.");
        setStatusText("");
        return;
      }
      if (oauthError) {
        const detail = oauthErrorDescription || oauthError;
        if (oauthError === "invalid_scope_error") {
          setErrorText(`LinkedIn authorization failed: ${detail}. Verify LinkedIn app permissions and LINKEDIN_SCOPE.`);
        } else {
          setErrorText(`LinkedIn authorization failed: ${detail}`);
        }
        setStatusText("");
        return;
      }
      if (!code || !state) {
        setErrorText("LinkedIn callback is missing code or state.");
        setStatusText("");
        return;
      }

      try {
        await connectLinkedIn({
          accessToken,
          step: "complete",
          code,
          state,
        });
        setStatusText("LinkedIn connected. Redirecting to workspace...");
        router.replace("/workspace?linkedin=connected");
      } catch (error) {
        const detail = error instanceof Error ? error.message : "LinkedIn connection failed";
        setErrorText(detail);
        setStatusText("");
      }
    }

    void complete();
  }, [accessToken, router, searchParams]);

  return (
    <main className="bg-rv text-rv-text flex min-h-screen items-center justify-center px-4">
      <section className="hairline bg-rv-2 w-full max-w-lg rounded-md p-6">
        <p className="label-eyebrow text-rv-dim">LinkedIn Integration</p>
        {statusText ? <p className="mt-3 text-sm">{statusText}</p> : null}
        {errorText ? <p className="mt-3 text-sm text-red-400">{errorText}</p> : null}
        <div className="mt-4">
          <Button variant="outline" className="bg-rv" onClick={() => router.replace("/workspace")}>Back to Workspace</Button>
        </div>
      </section>
    </main>
  );
}


export default function LinkedInCallbackPage() {
  return (
    <Suspense
      fallback={(
        <main className="bg-rv text-rv-text flex min-h-screen items-center justify-center px-4">
          <section className="hairline bg-rv-2 w-full max-w-lg rounded-md p-6">
            <p className="label-eyebrow text-rv-dim">LinkedIn Integration</p>
            <p className="mt-3 text-sm">Completing LinkedIn connection...</p>
          </section>
        </main>
      )}
    >
      <LinkedInCallbackInner />
    </Suspense>
  );
}
