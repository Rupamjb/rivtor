"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Lightbulb, Sparkles } from "lucide-react";

import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { FounderKnowledgeGraph } from "@/components/context/founder-knowledge-graph";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useFounderosDashboard } from "@/hooks/use-founderos-dashboard";


export default function FounderBriefPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { store, applySuggestedAction } = useFounderosDashboard();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login?next=/founder-brief");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-zinc-400">Loading Founder Brief...</div>;
  }

  const brief =
    store.founderBrief
    || {
      title: "Today’s Founder Brief",
      highlights: [
        `${store.documents.length} document(s) in company memory`,
        `${store.activities.length} operational event(s) tracked`,
        `${store.messages.filter((item) => item.kind === "approval" && item.status === "approval_required").length} pending approvals`,
      ],
      suggested_action: "Generate a launch post from your latest founder context.",
    };

  const suggestedActions = store.suggestedActions.length
    ? store.suggestedActions
    : [
        {
          id: "launch_post",
          label: "Generate launch post",
          reason: "Convert your operating context into a public narrative.",
          prompt: "Generate a launch announcement post using my uploaded company context.",
        },
        {
          id: "research_competitors",
          label: "Research competitors",
          reason: "Track rival positioning shifts before publishing.",
          prompt: "Research my competitors and summarize key positioning gaps.",
        },
      ];

  return (
    <div className="founderos-shell min-h-screen bg-[#090b11] px-4 py-6 text-zinc-100 sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">FounderOS</p>
            <h1 className="text-lg font-semibold">Founder Brief</h1>
          </div>

          <Button variant="outline" className="border-white/10 bg-white/[0.02]" onClick={() => router.push("/workspace")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Workspace
          </Button>
        </header>

        <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">{brief.title}</p>
          <div className="mt-3 space-y-2">
            {brief.highlights.map((item) => (
              <p key={item} className="text-sm text-zinc-200">- {item}</p>
            ))}
          </div>
          <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">
            Suggested action: {brief.suggested_action}
          </p>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
              <Brain className="h-3.5 w-3.5" /> Founder Profile
            </p>
            <div className="mt-2 space-y-1 text-xs text-zinc-300">
              <p>Tone: {store.founderProfile?.tone || "Learning"}</p>
              <p>Audience: {store.founderProfile?.audience || "Not detected yet"}</p>
              <p>Positioning: {store.founderProfile?.positioning || "Upload notes to derive positioning"}</p>
            </div>
            {store.founderProfile?.keywords?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {store.founderProfile.keywords.slice(0, 8).map((item) => (
                  <span key={item} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-300">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
              <Lightbulb className="h-3.5 w-3.5" /> Proactive Actions
            </p>
            <div className="mt-2 space-y-2">
              {suggestedActions.slice(0, 6).map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    applySuggestedAction(action.id);
                    router.push("/workspace");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-xs text-zinc-200 transition hover:bg-white/[0.05]"
                >
                  <p>{action.label}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">{action.reason}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
              <Sparkles className="h-3.5 w-3.5" /> Insights Detected
            </p>
            <div className="mt-2 space-y-1.5">
              {(store.founderInsights.length ? store.founderInsights : ["Upload founder notes to unlock intelligence insights."]).slice(0, 8).map((item) => (
                <p key={item} className="text-xs text-zinc-300">- {item}</p>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Knowledge Graph</p>
            <div className="mt-2">
              <FounderKnowledgeGraph nodes={store.knowledgeGraphNodes} edges={store.knowledgeGraphEdges} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Operational Timeline</p>
            <div className="mt-2">
              <ActivityTimeline items={store.activities} />
            </div>
          </section>
        </div>

        {store.startupRadar ? (
          <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-cyan-100">{store.startupRadar.title}</p>
            <div className="mt-2 space-y-1.5">
              {store.startupRadar.items.slice(0, 6).map((item) => (
                <p key={item} className="text-sm text-zinc-200">- {item}</p>
              ))}
            </div>
            <p className="mt-2 text-xs text-cyan-50">Suggested action: {store.startupRadar.suggested_action}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
