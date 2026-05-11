"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import Workspace from "@/legacy/pages/Workspace";


export default function WorkspacePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login?next=/workspace");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="bg-rv flex min-h-screen items-center justify-center text-rv-dim">
        Authenticating...
      </div>
    );
  }

  return <Workspace />;
}
