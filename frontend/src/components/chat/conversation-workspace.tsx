import { useEffect, useRef } from "react";
import { Activity, CheckCircle2, Lightbulb, Menu, Radar, PanelRightOpen, Plus } from "lucide-react";
import Link from "next/link";

import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { MessageCards } from "@/components/chat/message-cards";
import { ActiveAgentPill } from "@/components/agents/active-agent-pill";
import { Button } from "@/components/ui/button";
import type { FounderosDashboardStore } from "@/store/founderos-dashboard-store";
import type { VoiceComposerStatus } from "@/types/founderos-dashboard";


export function ConversationWorkspace({
  store,
  onToggleSidebarMobile,
  onToggleRightPanel,
  onNewWorkflow,
  onSend,
  onUpload,
  onApprove,
  onReject,
  onPublish,
  onSave,
  onVoiceStatus,
  onVoiceError,
  onDiscardVoice,
  onTranscribeAudio,
  onVoiceTranscript,
  onSuggestedAction,
}: {
  store: FounderosDashboardStore;
  onToggleSidebarMobile: () => void;
  onToggleRightPanel: () => void;
  onNewWorkflow: () => void;
  onSend: () => void;
  onUpload: (files: FileList | null) => void;
  onApprove: (generationId: string) => void;
  onReject: (generationId: string) => void;
  onPublish: (generationId: string, channel: "linkedin" | "internal") => void;
  onSave: (generationId: string) => void;
  onVoiceStatus: (value: VoiceComposerStatus) => void;
  onVoiceError: (value: string) => void;
  onDiscardVoice: () => void;
  onTranscribeAudio: (file: File) => Promise<void>;
  onVoiceTranscript: (transcript: string) => void;
  onSuggestedAction: (actionId: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const executionStages: Array<{ id: string; label: string; stage: FounderosDashboardStore["activeAgentStage"] }> = [
    { id: "memory", label: "Retrieving founder memory", stage: "retrieving_memory" },
    { id: "research", label: "Searching latest market context", stage: "researching_web" },
    { id: "draft", label: "Drafting founder-grade output", stage: "generating_response" },
    { id: "workflow", label: "Preparing approval workflow", stage: "preparing_output" },
  ];

  const activeStageIndex = executionStages.findIndex((item) => item.stage === store.activeAgentStage);

  const suggestedActions = store.suggestedActions.length
    ? store.suggestedActions
    : [
        { id: "launch_post", label: "Generate launch post", reason: "Turn memory into publish-ready content." },
        { id: "summarize_notes", label: "Summarize startup notes", reason: "Convert notes into immediate priorities." },
        { id: "research_competitors", label: "Research competitors", reason: "Track moves and identify differentiation." },
        { id: "investor_update", label: "Create investor update", reason: "Keep stakeholders aligned on execution." },
      ];

  useEffect(() => {
    const target = scrollRef.current;
    if (!target) {
      return;
    }
    if (typeof target.scrollTo === "function") {
      target.scrollTo({
        top: target.scrollHeight,
        behavior: "smooth",
      });
      return;
    }
    target.scrollTop = target.scrollHeight;
  }, [store.messages, store.sending]);

  return (
    <section className="relative flex min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-3 py-3 sm:px-5">
        <div className="inline-flex items-center gap-2">
          <Button size="icon" variant="outline" className="border-white/10 bg-white/[0.02] lg:hidden" onClick={onToggleSidebarMobile}>
            <Menu className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm font-medium tracking-tight text-zinc-100">Founder Workspace</p>
            <p className="text-xs text-zinc-500">ChatGPT-style operational console</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2">
          <ActiveAgentPill stage={store.activeAgentStage} label={store.activeAgentLabel} />
          <Button variant="outline" className="hidden border-white/10 bg-white/[0.02] lg:inline-flex" onClick={onToggleRightPanel}>
            <PanelRightOpen className="mr-2 h-4 w-4" /> Context
          </Button>
          <Button asChild variant="outline" className="hidden border-white/10 bg-white/[0.02] lg:inline-flex">
            <Link href="/founder-brief">Founder Brief</Link>
          </Button>
          <Button variant="outline" className="border-white/10 bg-white/[0.02]" onClick={onNewWorkflow}>
            <Plus className="mr-2 h-4 w-4" /> New Workflow
          </Button>
        </div>
      </header>

      <div ref={scrollRef} className="founderos-scroll flex-1 overflow-y-auto px-3 pb-12 pt-5 sm:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {store.founderBrief ? (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">{store.founderBrief.title}</p>
              <div className="mt-3 space-y-2">
                {store.founderBrief.highlights.map((item) => (
                  <p key={item} className="text-sm text-zinc-200">- {item}</p>
                ))}
              </div>
              <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">
                Suggested action: {store.founderBrief.suggested_action}
              </p>
            </div>
          ) : null}

          {store.startupRadar ? (
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-cyan-200">
                <Radar className="h-3.5 w-3.5" /> {store.startupRadar.title}
              </p>
              <div className="mt-3 space-y-1.5">
                {store.startupRadar.items.slice(0, 5).map((item) => (
                  <p key={item} className="text-sm text-zinc-200">- {item}</p>
                ))}
              </div>
              <p className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs text-cyan-100">
                Suggested action: {store.startupRadar.suggested_action}
              </p>
            </div>
          ) : null}

          {(store.sending || store.activeAgentStage !== "idle") && store.selectedAgent !== "research" ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-zinc-400">
                <Activity className="h-3.5 w-3.5" /> Multi-step execution
              </p>
              <div className="mt-3 grid gap-2">
                {executionStages.map((item, index) => {
                  const completed = activeStageIndex > index || store.activeAgentStage === "idle";
                  const active = store.activeAgentStage === item.stage;
                  return (
                    <div key={item.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
                      {completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                      ) : (
                        <span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-amber-300" : "bg-zinc-600"}`} />
                      )}
                      <span className={active ? "text-zinc-100" : "text-zinc-300"}>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-2">
                <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Live memory injection</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {store.contextBadges.slice(0, 6).map((badge) => (
                    <span key={badge} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-zinc-300">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {store.messages.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <h2 className="text-xl font-semibold text-zinc-100">FounderOS Operating Workspace</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Ask FounderOS to research markets, retrieve memory, generate content, and execute approval-gated workflows.
              </p>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left">
                <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">FounderOS is monitoring</p>
                <div className="mt-2 grid gap-1 text-xs text-zinc-300 sm:grid-cols-2">
                  <p>- AI startup trends</p>
                  <p>- Founder memory signals</p>
                  <p>- Pending approvals</p>
                  <p>- Recent research activity</p>
                </div>
              </div>
            </div>
          ) : null}

          {store.documents.length > 0 || suggestedActions.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left">
              <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-zinc-400">
                <Lightbulb className="h-3.5 w-3.5" /> Suggested Actions
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {suggestedActions.slice(0, 6).map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="justify-start border-white/10 bg-white/[0.02] text-xs"
                    onClick={() => onSuggestedAction(action.id)}
                    title={"reason" in action ? String(action.reason) : ""}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          <MessageCards messages={store.messages} onApprove={onApprove} onReject={onReject} onPublish={onPublish} onSave={onSave} />
        </div>
      </div>

      {store.composerError ? (
        <div className="px-5 pb-2 text-sm text-rose-300">{store.composerError}</div>
      ) : null}

      <ChatInputBar
        value={store.input}
        onValue={store.setInput}
        sending={store.sending}
        selectedAgent={store.selectedAgent}
        onSelectAgent={store.setSelectedAgent}
        contentFormat={store.contentFormat}
        onContentFormat={store.setContentFormat}
        contentImageEnabled={store.contentImageEnabled}
        onContentImageEnabled={store.setContentImageEnabled}
        contentTone={store.contentTone}
        onContentTone={store.setContentTone}
        contentLength={store.contentLength}
        onContentLength={store.setContentLength}
        queuedFiles={store.uploadedFiles}
        onUploadFiles={onUpload}
        onSubmit={onSend}
        voiceStatus={store.voiceStatus}
        voicePreview={store.voicePreview}
        voiceError={store.voiceError}
        onVoiceStatus={onVoiceStatus}
        onVoiceError={onVoiceError}
        onDiscardVoice={onDiscardVoice}
        onTranscribeAudio={onTranscribeAudio}
        onVoiceTranscript={onVoiceTranscript}
      />
    </section>
  );
}
