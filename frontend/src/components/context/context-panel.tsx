import { motion } from "framer-motion";
import { useRef } from "react";
import { Brain, FileText, Globe, Layers2, Link2, Radar, Search, Sparkle, Workflow } from "lucide-react";

import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { ActiveAgentPill } from "@/components/agents/active-agent-pill";
import { FounderKnowledgeGraph } from "@/components/context/founder-knowledge-graph";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActivityFeedItem } from "@/lib/activities-feed";
import type { MemoryDocument, MemorySearchItem } from "@/lib/company-brain";
import type { ContextMemoryItem, ContextResearchItem, FounderProfile, KnowledgeGraphEdge, KnowledgeGraphNode, StartupRadar } from "@/types/founderos-dashboard";


function highlightSnippet(text: string, query: string) {
  const normalized = query.trim();
  if (!normalized) {
    return text;
  }
  const pattern = new RegExp(`(${normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  const parts = text.split(pattern);
  return parts.map((part, index) => {
    if (part.toLowerCase() === normalized.toLowerCase()) {
      return (
        <mark key={`${part}-${index}`} className="rounded bg-emerald-300/20 px-0.5 text-emerald-100">
          {part}
        </mark>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}


export function ContextPanel({
  memory,
  research,
  badges,
  activities,
  documents,
  linkedInStatus,
  linkedInConnectedAt,
  linkedInBusy,
  linkedInError,
  activeAgentStage,
  activeAgentLabel,
  founderProfile,
  founderInsights,
  startupRadar,
  knowledgeGraphNodes,
  knowledgeGraphEdges,
  memorySearchQuery,
  memorySearchBusy,
  memorySearchError,
  memorySearchItems,
  onSearchMemory,
  onTrainFounderos,
  onConnectLinkedIn,
}: {
  memory: ContextMemoryItem[];
  research: ContextResearchItem[];
  badges: string[];
  activities: ActivityFeedItem[];
  documents: MemoryDocument[];
  linkedInStatus: "disconnected" | "connecting" | "connected";
  linkedInConnectedAt: string;
  linkedInBusy: boolean;
  linkedInError: string;
  activeAgentStage: "idle" | "retrieving_memory" | "researching_web" | "generating_response" | "preparing_output";
  activeAgentLabel: string;
  founderProfile: FounderProfile | null;
  founderInsights: string[];
  startupRadar: StartupRadar | null;
  knowledgeGraphNodes: KnowledgeGraphNode[];
  knowledgeGraphEdges: KnowledgeGraphEdge[];
  memorySearchQuery: string;
  memorySearchBusy: boolean;
  memorySearchError: string;
  memorySearchItems: MemorySearchItem[];
  onSearchMemory: (query: string) => Promise<void>;
  onTrainFounderos: (files: FileList | null) => Promise<void>;
  onConnectLinkedIn: (forceReconnect: boolean) => void | Promise<void>;
}) {
  const trainInputRef = useRef<HTMLInputElement | null>(null);
  const collaborationSteps = [
    {
      id: "research",
      label: "Research Agent",
      detail: research.length > 0 ? `${research.length} research signal(s) loaded` : "Waiting for research context",
      active: activeAgentStage === "researching_web",
      complete: research.length > 0,
    },
    {
      id: "content",
      label: "Content Agent",
      detail: memory.length > 0 ? `${memory.length} memory source(s) injected` : "Waiting for memory injection",
      active: activeAgentStage === "generating_response",
      complete: memory.length > 0,
    },
    {
      id: "executive",
      label: "Executive Agent",
      detail: activeAgentStage === "preparing_output" ? "Preparing final operating output" : "Waiting for orchestration",
      active: activeAgentStage === "preparing_output",
      complete: activeAgentStage === "idle" && (research.length > 0 || memory.length > 0),
    },
  ];

  const resolvedBadges = badges.length
    ? badges
    : [
        ...new Set(
          [
            ...memory.slice(0, 3).map((item) => item.sourceLabel),
            ...research.slice(0, 2).map((item) => item.sourceLabel),
            ...documents.slice(0, 2).map((item) => item.source_label || "Founder Notes"),
          ].filter(Boolean),
        ),
      ];

  return (
    <aside className="hidden h-screen w-[340px] shrink-0 overflow-y-auto border-l border-white/10 bg-[radial-gradient(circle_at_top,#1b1d28_0%,#111318_45%,#0b0d12_100%)] p-4 lg:block">
      <div className="space-y-4 pb-6">
        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Brain className="h-3.5 w-3.5" /> Founder Memory
          </p>
          <div className="mt-2 space-y-1 text-xs text-zinc-300">
            <p>Tone: {founderProfile?.tone || "Learning from uploads"}</p>
            <p>Audience: {founderProfile?.audience || "Not detected yet"}</p>
            <p>Positioning: {founderProfile?.positioning || "Upload notes to map positioning"}</p>
          </div>
          {founderProfile?.competitors?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {founderProfile.competitors.slice(0, 4).map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10px] text-zinc-300">
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-2">
            <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Train FounderOS</p>
            <p className="mt-1 text-[11px] text-zinc-500">Upload old posts, pitch decks, and strategy docs to evolve model context.</p>
            <input
              ref={trainInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                void onTrainFounderos(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2 w-full border-white/10 bg-white/[0.02] text-xs"
              onClick={() => trainInputRef.current?.click()}
            >
              Train FounderOS
            </Button>
          </div>
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Sparkle className="h-3.5 w-3.5" /> Insights Detected
          </p>
          <div className="mt-2 space-y-1.5">
            {(founderInsights.length ? founderInsights : ["Upload startup docs to unlock founder intelligence insights."]).slice(0, 5).map((item) => (
              <p key={item} className="text-xs text-zinc-300">- {item}</p>
            ))}
          </div>
        </motion.section>

        {startupRadar ? (
          <motion.section layout className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-3">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-cyan-100">
              <Radar className="h-3.5 w-3.5" /> {startupRadar.title}
            </p>
            <div className="mt-2 space-y-1">
              {startupRadar.items.slice(0, 4).map((item) => (
                <p key={item} className="text-xs text-zinc-200">- {item}</p>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-cyan-50">{startupRadar.suggested_action}</p>
          </motion.section>
        ) : null}

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Link2 className="h-3.5 w-3.5" /> Integration
          </p>
          <p className="mt-2 text-sm text-zinc-200">LinkedIn</p>
          <p className="mt-1 text-xs text-zinc-400">Status: {linkedInStatus}</p>
          {linkedInConnectedAt ? <p className="mt-1 text-[11px] text-zinc-500">Connected: {linkedInConnectedAt}</p> : null}
          <Button size="sm" variant="outline" className="mt-3 w-full bg-white/[0.02]" disabled={linkedInBusy} onClick={() => onConnectLinkedIn(linkedInStatus === "connected")}> 
            {linkedInBusy ? "Connecting..." : linkedInStatus === "connected" ? "Reconnect LinkedIn" : "Connect LinkedIn"}
          </Button>
          {linkedInError ? <p className="mt-2 text-xs text-rose-300">{linkedInError}</p> : null}
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Layers2 className="h-3.5 w-3.5" /> Active Agent
          </p>
          <div className="mt-2">
            <ActiveAgentPill stage={activeAgentStage} label={activeAgentLabel} />
          </div>
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Workflow className="h-3.5 w-3.5" /> Agent Collaboration
          </p>
          <div className="mt-2 space-y-2">
            {collaborationSteps.map((step) => (
              <div key={step.id} className="rounded-xl border border-white/10 bg-white/[0.02] px-2 py-1.5">
                <p className={`text-xs ${step.active ? "text-emerald-200" : step.complete ? "text-zinc-200" : "text-zinc-400"}`}>
                  {step.complete ? "✓" : step.active ? "●" : "○"} {step.label}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">{step.detail}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Brain className="h-3.5 w-3.5" /> Active Memory
          </p>
          <div className="mt-2 space-y-2">
            {memory.length > 0 ? (
              memory.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-zinc-200/90">{item.title}</p>
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-emerald-300">{item.scoreLabel}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{item.snippet}</p>
                  <span className="mt-1 inline-block text-[10px] text-zinc-500">{item.sourceLabel}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500">No memory retrieved in this run.</p>
            )}
          </div>
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Globe className="h-3.5 w-3.5" /> Web Research
          </p>
          <div className="mt-2 space-y-2">
            {research.length > 0 ? (
              research.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-xs text-zinc-200/90">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">{item.snippet}</p>
                  <p className="mt-1 text-[10px] text-zinc-500">{item.sourceLabel}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500">No web context yet.</p>
            )}
          </div>
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Sparkle className="h-3.5 w-3.5" /> Context Badges
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {resolvedBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] text-zinc-300">
                {badge}
              </span>
            ))}
            {resolvedBadges.length === 0 ? <p className="text-xs text-zinc-500">No context tags yet.</p> : null}
          </div>
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Search className="h-3.5 w-3.5" /> Second Brain Search
          </p>
          <div className="mt-2 space-y-2">
            <Input
              value={memorySearchQuery}
              onChange={(event) => {
                void onSearchMemory(event.target.value);
              }}
              placeholder="Search founder memory..."
              className="h-8 border-white/10 bg-white/[0.02] text-xs"
            />

            {memorySearchBusy ? <p className="text-xs text-zinc-400">Searching memory...</p> : null}
            {memorySearchError ? <p className="text-xs text-rose-300">{memorySearchError}</p> : null}
            {memorySearchItems.slice(0, 4).map((item, index) => (
                <div key={`${item.vector_id}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
                <p className="line-clamp-1 text-xs text-zinc-200/90">{item.file_name}</p>
                <p className="mt-1 line-clamp-3 text-[11px] text-zinc-400">{highlightSnippet(item.text, memorySearchQuery)}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{item.source_label}</span>
                  <span>{Math.round((item.score || 0.75) * 100)}%</span>
                </div>
              </div>
            ))}
            {memorySearchQuery && !memorySearchBusy && !memorySearchItems.length && !memorySearchError ? (
              <p className="text-xs text-zinc-500">No matching memory snippets yet.</p>
            ) : null}
          </div>
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <Workflow className="h-3.5 w-3.5" /> Knowledge Graph
          </p>
          <div className="mt-2">
            <FounderKnowledgeGraph nodes={knowledgeGraphNodes} edges={knowledgeGraphEdges} />
          </div>
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-400">
            <FileText className="h-3.5 w-3.5" /> Uploaded Documents
          </p>
          <div className="mt-2 space-y-2">
            {documents.length > 0 ? (
              documents.slice(0, 5).map((document) => (
                <button
                  key={document.id}
                  type="button"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.02] px-2 py-1.5 text-left transition hover:bg-white/[0.05]"
                  onClick={() => {
                    void onSearchMemory(document.file_name || document.source_label || "founder notes");
                  }}
                >
                  <p className="line-clamp-1 text-xs text-zinc-200/90">{document.file_name}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">{document.source_label || "Founder Notes"}</p>
                </button>
              ))
            ) : (
              <p className="text-xs text-zinc-500">No uploaded documents yet.</p>
            )}
          </div>
        </motion.section>

        <motion.section layout className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Activity Feed</p>
          <div className="mt-2">
            <ActivityTimeline items={activities} />
          </div>
        </motion.section>
      </div>
    </aside>
  );
}
