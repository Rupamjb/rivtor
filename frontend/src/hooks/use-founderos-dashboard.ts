"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/AuthContext";
import { listActivitiesFeed, type ActivityFeedItem } from "@/lib/activities-feed";
import { runMultiAgentRoute } from "@/lib/agent-router";
import { approveGeneration, publishGeneration, rejectGeneration } from "@/lib/approvals";
import { streamChatQuery, type ChatCitation, type ChatHistoryTurn, type ChatStreamEvent } from "@/lib/chat";
import {
  getFounderIntelligence,
  listMemoryDocuments,
  searchMemoryChunks,
  uploadMemoryDocument,
  type MemorySearchItem,
} from "@/lib/company-brain";
import { runContentAgent } from "@/lib/content-agent";
import { connectLinkedIn, linkedinConnectionStatus, publishLinkedIn } from "@/lib/linkedin";
import { runResearchAgent } from "@/lib/research-agent";
import { getStartupRadar } from "@/lib/startup-radar";
import { transcribeVoice } from "@/lib/voice";
import { mockContentResponse, mockExecutiveResponse, mockResearchResponse, simulateAssistantStream } from "@/services/founderos-mock";
import { useFounderosDashboardStore } from "@/store/founderos-dashboard-store";
import type { ContextMemoryItem, ContextResearchItem, DashboardMessage, SuggestedAction, WorkflowDraftStatus, WorkflowHistoryItem } from "@/types/founderos-dashboard";


function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stageLabel(stage: string): string {
  if (stage === "retrieving_memory") {
    return "Retrieving memory...";
  }
  if (stage === "researching_web") {
    return "Searching web...";
  }
  if (stage === "generating_response") {
    return "Drafting response...";
  }
  if (stage === "preparing_output") {
    return "Preparing output...";
  }
  return "Idle";
}

function toContextMemory(citations: ChatCitation[]): ContextMemoryItem[] {
  return citations.map((item, index) => ({
    id: `${item.file_name}-${index}`,
    title: item.file_name,
    scoreLabel: `${Math.round((item.score ?? 0.8) * 100)}%`,
    sourceLabel: item.source_label,
    snippet: item.text_excerpt || "Memory snippet unavailable.",
  }));
}

function toActivityFallback(): ActivityFeedItem[] {
  const now = new Date().toISOString();
  return [
    { id: "fallback-1", event_type: "research_completed", metadata: {}, created_at: now },
    { id: "fallback-2", event_type: "content_draft_created", metadata: {}, created_at: now },
    { id: "fallback-3", event_type: "approval_approved", metadata: {}, created_at: now },
  ];
}

function normalizeLinkedInStatus(status: string): "disconnected" | "connecting" | "connected" {
  if (status === "connected") {
    return "connected";
  }
  if (status === "pending") {
    return "connecting";
  }
  return "disconnected";
}

function isLocalFallbackGeneration(generationId: string): boolean {
  const id = generationId.trim().toLowerCase();
  return id.startsWith("mock-") || id.startsWith("local-");
}

function mergeTranscriptIntoInput(currentInput: string, transcript: string): string {
  if (!currentInput.trim()) {
    return transcript;
  }
  return `${currentInput.trimEnd()}\n${transcript}`;
}

function cloneSnapshot<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type WorkflowSnapshot = {
  input: string;
  messages: DashboardMessage[];
  selectedAgent: "executive" | "research" | "content" | "orchestrator";
  contentFormat: string;
  contentTone: "professional" | "bold" | "insightful" | "casual";
  contentLength: "short" | "medium" | "long";
  contentImageEnabled: boolean;
  contextMemory: ContextMemoryItem[];
  contextResearch: ContextResearchItem[];
  contextBadges: string[];
  composerError: string;
};

function formatMonthYear(date = new Date()): string {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function generateWorkflowTitle(query: string, agent: "executive" | "research" | "content" | "orchestrator", format: string): string {
  const normalized = query.toLowerCase();
  if (agent === "content") {
    if (format === "linkedin") {
      return `LinkedIn Campaign - ${formatMonthYear()}`;
    }
    if (format === "x_post") {
      return `Founder Thread - ${formatMonthYear()}`;
    }
    if (format === "blog_outline") {
      return `Blog Outline Sprint - ${formatMonthYear()}`;
    }
  }
  if (agent === "research" || normalized.includes("research") || normalized.includes("competitor")) {
    return `Market Intelligence - ${formatMonthYear()}`;
  }
  if (agent === "orchestrator") {
    return `Multi-Agent Execution - ${formatMonthYear()}`;
  }
  if (normalized.includes("investor")) {
    return `Investor Update - ${formatMonthYear()}`;
  }
  return `AI Operating Workflow - ${formatMonthYear()}`;
}

function buildDailyFounderBrief(store: ReturnType<typeof useFounderosDashboardStore.getState>) {
  const pendingApprovals = store.messages.filter(
    (item) => item.kind === "approval" && item.status === "approval_required",
  ).length;
  const publishedCount = store.messages.filter(
    (item) => (item.kind === "approval" || item.kind === "linkedin_post") && item.status === "published",
  ).length;
  const competitor = store.founderProfile?.competitors?.[0] || "a tracked competitor";
  const docsCount = store.documents.length;

  return {
    title: "Today’s Founder Brief",
    highlights: [
      `${docsCount} company document(s) loaded into Founder Memory`,
      `${pendingApprovals} pending approval workflow(s) need review`,
      `${publishedCount} publish-ready output(s) completed in this workspace`,
      `Monitor ${competitor} for launch and positioning changes`,
    ],
    suggested_action:
      pendingApprovals > 0
        ? "Approve and publish one pending draft to keep narrative momentum."
        : "Generate a launch post using your latest memory and publish today.",
  };
}

function normalizeSuggestedActions(items: SuggestedAction[]): SuggestedAction[] {
  const fallback: SuggestedAction[] = [
    {
      id: "launch_post",
      label: "Generate launch post",
      prompt: "Generate a launch announcement post using my uploaded company context.",
      reason: "Convert strategic context into external momentum.",
    },
    {
      id: "research_competitors",
      label: "Research competitors",
      prompt: "Research my competitors and summarize key positioning gaps.",
      reason: "Track market movement before publishing.",
    },
    {
      id: "investor_update",
      label: "Create investor update",
      prompt: "Create an investor update using my latest company notes and research context.",
      reason: "Keep investors aligned on execution.",
    },
    {
      id: "founder_thread",
      label: "Draft founder thread",
      prompt: "Draft a concise founder thread summarizing this week’s progress and next priorities.",
      reason: "Expand distribution while preserving founder voice.",
    },
  ];

  if (!items.length) {
    return fallback;
  }
  return items.slice(0, 6);
}

function buildMemoryDiff(previous: ReturnType<typeof useFounderosDashboardStore.getState>["founderProfile"], nextProfile: ReturnType<typeof useFounderosDashboardStore.getState>["founderProfile"]): string[] {
  if (!nextProfile) {
    return [];
  }

  const changes: string[] = [];
  if (!previous?.positioning && nextProfile.positioning) {
    changes.push(`New product positioning: ${nextProfile.positioning}`);
  } else if (previous?.positioning && nextProfile.positioning && previous.positioning !== nextProfile.positioning) {
    changes.push(`Positioning updated from "${previous.positioning}" to "${nextProfile.positioning}"`);
  }

  const previousKeywords = new Set((previous?.keywords || []).map((value) => value.toLowerCase()));
  const newKeywords = (nextProfile.keywords || []).filter((value) => !previousKeywords.has(value.toLowerCase()));
  if (newKeywords.length > 0) {
    changes.push(`Expanded AI workflow focus: ${newKeywords.slice(0, 4).join(", ")}`);
  }

  if (previous?.tone !== nextProfile.tone && nextProfile.tone) {
    changes.push(`Founder tone updated: ${nextProfile.tone}`);
  }

  const prevGoals = new Set((previous?.goals || []).map((value) => value.toLowerCase()));
  const addedGoals = (nextProfile.goals || []).filter((value) => !prevGoals.has(value.toLowerCase()));
  if (addedGoals.length > 0) {
    changes.push(`Increased emphasis on founder productivity goals: ${addedGoals.slice(0, 3).join(", ")}`);
  }

  return changes.slice(0, 4);
}

function buildChatHistory(messages: DashboardMessage[]): ChatHistoryTurn[] {
  const turns: ChatHistoryTurn[] = [];

  for (const message of messages) {
    if (message.kind === "user") {
      const content = message.text.trim();
      if (content) {
        turns.push({ role: "user", content });
      }
      continue;
    }
    if (message.kind === "assistant") {
      const content = message.markdown.trim();
      if (content) {
        turns.push({ role: "assistant", content });
      }
    }
  }

  return turns.slice(-12);
}

type SuggestedActionId =
  | "launch_post"
  | "summarize_notes"
  | "research_competitors"
  | "investor_update"
  | "founder_thread"
  | "competitor_response"
  | "save_memory";

export function useFounderosDashboard() {
  const { user, session } = useAuth();
  const accessToken = session?.access_token ?? "";

  const store = useFounderosDashboardStore();
  const workflowSnapshotsRef = useRef<Record<string, WorkflowSnapshot>>({});
  const [activeWorkflowId, setActiveWorkflowId] = useState("");
  const [activeSidebarNav, setActiveSidebarNav] = useState("dashboard");
  const [memorySearchQuery, setMemorySearchQuery] = useState("");
  const [memorySearchBusy, setMemorySearchBusy] = useState(false);
  const [memorySearchError, setMemorySearchError] = useState("");
  const [memorySearchItems, setMemorySearchItems] = useState<MemorySearchItem[]>([]);

  const activitiesQuery = useQuery({
    queryKey: ["founderos", "activities", user?.id],
    enabled: Boolean(accessToken),
    queryFn: async () => listActivitiesFeed({ accessToken, limit: 25 }),
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (activitiesQuery.data) {
      useFounderosDashboardStore.getState().setActivities(activitiesQuery.data.items);
      return;
    }
    if (activitiesQuery.error) {
      useFounderosDashboardStore.getState().setActivities(toActivityFallback());
    }
  }, [activitiesQuery.data, activitiesQuery.error]);

  const documentsQuery = useQuery({
    queryKey: ["founderos", "documents", user?.id],
    enabled: Boolean(accessToken),
    queryFn: async () => listMemoryDocuments({ accessToken }),
  });

  useEffect(() => {
    if (documentsQuery.data) {
      useFounderosDashboardStore.getState().setDocuments(documentsQuery.data.items);
    }
  }, [documentsQuery.data]);

  const founderIntelligenceQuery = useQuery({
    queryKey: ["founderos", "founder-intelligence", user?.id],
    enabled: Boolean(accessToken),
    queryFn: async () => getFounderIntelligence({ accessToken }),
  });

  useEffect(() => {
    if (!founderIntelligenceQuery.data) {
      return;
    }
    const intel = founderIntelligenceQuery.data;
    const state = useFounderosDashboardStore.getState();
    state.setFounderProfile(intel.profile);
    state.setFounderInsights(intel.insights || []);
    state.setSuggestedActions(normalizeSuggestedActions(intel.suggested_actions || []));
    state.setKnowledgeGraph(intel.knowledge_graph?.nodes || [], intel.knowledge_graph?.edges || []);
    state.setFounderBrief(buildDailyFounderBrief(state));
  }, [founderIntelligenceQuery.data]);

  const linkedInStatusQuery = useQuery({
    queryKey: ["founderos", "linkedin-status", user?.id],
    enabled: Boolean(accessToken),
    queryFn: async () => linkedinConnectionStatus({ accessToken }),
  });

  useEffect(() => {
    if (linkedInStatusQuery.data) {
      useFounderosDashboardStore.getState().setLinkedInStatus(normalizeLinkedInStatus(linkedInStatusQuery.data.connection_status), linkedInStatusQuery.data.connected_at || "");
      useFounderosDashboardStore.getState().setLinkedInError("");
      return;
    }
    if (linkedInStatusQuery.error) {
      const detail = linkedInStatusQuery.error instanceof Error ? linkedInStatusQuery.error.message : "Failed to load LinkedIn status";
      useFounderosDashboardStore.getState().setLinkedInStatus("disconnected", "");
      useFounderosDashboardStore.getState().setLinkedInError(detail);
    }
  }, [linkedInStatusQuery.data, linkedInStatusQuery.error]);

  const startupRadarQuery = useQuery({
    queryKey: ["founderos", "startup-radar", user?.id],
    enabled: Boolean(accessToken),
    queryFn: async () => getStartupRadar({ accessToken }),
    refetchInterval: 10 * 60_000,
  });

  useEffect(() => {
    if (!startupRadarQuery.data) {
      if (startupRadarQuery.error) {
        useFounderosDashboardStore.getState().setStartupRadar(null);
      }
      return;
    }
    useFounderosDashboardStore.getState().setStartupRadar({
      title: startupRadarQuery.data.title,
      items: startupRadarQuery.data.items,
      suggested_action: startupRadarQuery.data.suggested_action,
      generated_at: new Date().toISOString(),
    });
  }, [startupRadarQuery.data, startupRadarQuery.error]);

  const workflowHistory = useMemo<WorkflowHistoryItem[]>(() => {
    return store.recentWorkflows;
  }, [store.recentWorkflows]);

  function captureWorkflowSnapshot(workflowId: string) {
    if (!workflowId) {
      return;
    }
    const state = useFounderosDashboardStore.getState();
    workflowSnapshotsRef.current[workflowId] = cloneSnapshot({
      input: state.input,
      messages: state.messages,
      selectedAgent: state.selectedAgent,
      contentFormat: state.contentFormat,
      contentTone: state.contentTone,
      contentLength: state.contentLength,
      contentImageEnabled: state.contentImageEnabled,
      contextMemory: state.contextMemory,
      contextResearch: state.contextResearch,
      contextBadges: state.contextBadges,
      composerError: state.composerError,
    });
  }

  function restoreWorkflowSnapshot(workflowId: string): boolean {
    const snapshot = workflowSnapshotsRef.current[workflowId];
    if (!snapshot) {
      return false;
    }

    store.setSelectedAgent(snapshot.selectedAgent);
    store.setInput(snapshot.input);
    store.setContentFormat(snapshot.contentFormat as typeof store.contentFormat);
    store.setContentTone(snapshot.contentTone);
    store.setContentLength(snapshot.contentLength);
    store.setContentImageEnabled(snapshot.contentImageEnabled);
    store.setMessages(cloneSnapshot(snapshot.messages));
    store.setContextMemory(cloneSnapshot(snapshot.contextMemory));
    store.setContextResearch(cloneSnapshot(snapshot.contextResearch));
    store.setContextBadges(cloneSnapshot(snapshot.contextBadges));
    store.setComposerError(snapshot.composerError);
    return true;
  }

  function startNewWorkflow() {
    store.clearConversation();
    setActiveWorkflowId("");
    setActiveSidebarNav("dashboard");
  }

  function openWorkflow(workflowId: string) {
    setActiveWorkflowId(workflowId);
    setActiveSidebarNav("dashboard");
    store.setRightPanelOpen(true);

    if (restoreWorkflowSnapshot(workflowId)) {
      return;
    }

    const workflow = useFounderosDashboardStore.getState().recentWorkflows.find((item) => item.id === workflowId);
    if (workflow) {
      store.setInput(`Continue workflow: ${workflow.title}`);
    }
  }

  function selectSidebarNav(navId: string) {
    setActiveSidebarNav(navId);

    if (navId === "dashboard") {
      store.setRightPanelOpen(true);
      return;
    }

    if (navId === "knowledge") {
      store.setRightPanelOpen(true);
      const memoryQuery = store.founderProfile?.startup_name || store.founderProfile?.positioning || "founder memory";
      void searchFounderMemory(memoryQuery);
      return;
    }

    if (navId === "agents") {
      store.setSelectedAgent("orchestrator");
      store.setInput("Run a multi-agent route for my highest-leverage next move.");
      return;
    }

    if (navId === "outputs") {
      store.setSelectedAgent("content");
      store.setInput("Generate the next high-impact founder output using current context.");
      return;
    }

    if (navId === "activity") {
      store.setRightPanelOpen(true);
      void syncActivities();
      store.setSelectedAgent("executive");
      store.setInput("Summarize my recent FounderOS activity and recommend next actions.");
      return;
    }

    if (navId === "settings") {
      store.setRightPanelOpen(true);
      store.setInput("Review my FounderOS operating preferences and suggest tuning improvements.");
    }
  }

  async function syncActivities() {
    if (!accessToken) {
      return;
    }
    try {
      const payload = await listActivitiesFeed({ accessToken, limit: 25 });
      store.setActivities(payload.items);
    } catch {
      store.setActivities(toActivityFallback());
    }

    const currentState = useFounderosDashboardStore.getState();
    if (!currentState.suggestedActions.length) {
      currentState.setSuggestedActions(normalizeSuggestedActions([]));
    }
    currentState.setFounderBrief(buildDailyFounderBrief(currentState));
  }

  function rankActionsForOutcome(outcome: "executive" | "research" | "content" | "orchestrator") {
    const preferredByOutcome: Record<string, string[]> = {
      executive: ["launch_post", "investor_update", "research_competitors", "founder_thread"],
      research: ["launch_post", "investor_update", "competitor_response", "founder_thread"],
      content: ["investor_update", "research_competitors", "save_memory", "founder_thread"],
      orchestrator: ["launch_post", "research_competitors", "investor_update", "founder_thread"],
    };

    const preferred = preferredByOutcome[outcome];
    const current = normalizeSuggestedActions(useFounderosDashboardStore.getState().suggestedActions);
    const ranked = [...current].sort((a, b) => {
      const aIndex = preferred.indexOf(a.id);
      const bIndex = preferred.indexOf(b.id);
      const aRank = aIndex === -1 ? 99 : aIndex;
      const bRank = bIndex === -1 ? 99 : bIndex;
      return aRank - bRank;
    });
    useFounderosDashboardStore.getState().setSuggestedActions(ranked);
  }

  async function sendMessage() {
    const query = store.input.trim();
    if (!query || store.sending || !accessToken) {
      return;
    }

    store.setComposerError("");
    store.setSending(true);
    store.setInput("");
    store.clearVoice();

    const userMessage: DashboardMessage = {
      id: createId("msg-user"),
      kind: "user",
      createdAt: new Date().toISOString(),
      text: query,
    };
    store.addMessage(userMessage);
    const workflowId = createId("wf");
    setActiveWorkflowId(workflowId);
    store.addRecentWorkflow({
      id: workflowId,
      title: generateWorkflowTitle(query, store.selectedAgent, store.contentFormat),
      timestamp: "now",
    });

    if (store.selectedAgent === "executive") {
      const history = buildChatHistory(store.messages);
      const assistantId = createId("msg-assistant");
      store.addMessage({
        id: assistantId,
        kind: "assistant",
        createdAt: new Date().toISOString(),
        markdown: "",
        streaming: true,
      });

      let draft = "";
      let finalCitations: ChatCitation[] = [];

      const handleEvent = (event: ChatStreamEvent) => {
        if (event.type === "status") {
          store.setActiveAgent(event.stage, stageLabel(event.stage));
          return;
        }
        if (event.type === "token") {
          draft += event.token;
          store.patchMessage(assistantId, {
            markdown: draft,
            streaming: true,
          });
          return;
        }
        if (event.type === "citations") {
          finalCitations = event.items;
          store.patchMessage(assistantId, {
            citations: event.items,
          });
          store.setContextMemory(toContextMemory(event.items));
          return;
        }
        if (event.type === "done") {
          store.patchMessage(assistantId, {
            markdown: draft || "No response generated.",
            streaming: false,
          });
          if (finalCitations.length > 0) {
            store.addMessage({
              id: createId("msg-memory"),
              kind: "memory",
              createdAt: new Date().toISOString(),
              title: "Memory Retrieval",
              items: finalCitations.map((citation) => ({
                text: citation.text_excerpt || "Memory snippet unavailable.",
                file_name: citation.file_name,
                source_label: citation.source_label,
                document_id: citation.vector_id || "",
                vector_id: citation.vector_id || "",
                score: citation.score,
              })),
            });
          }
        }
        if (event.type === "error") {
          store.setComposerError(event.detail);
          store.patchMessage(assistantId, {
            markdown: draft || "I hit an error while generating the response.",
            streaming: false,
          });
        }
      };

      try {
        await streamChatQuery({
          accessToken,
          query,
          agentType: "executive",
          history,
          topK: 3,
          onEvent: handleEvent,
        });
      } catch {
        const mock = mockExecutiveResponse(query);
        draft = "";
        await simulateAssistantStream({
          text: mock.markdown,
          onToken: (token) => {
            draft += token;
            store.patchMessage(assistantId, {
              markdown: draft,
              streaming: true,
            });
          },
        });
        store.patchMessage(assistantId, {
          markdown: mock.markdown,
          streaming: false,
          citations: mock.citations,
        });
        store.setContextMemory(toContextMemory(mock.citations));
      }

      store.setSending(false);
      store.setActiveAgent("idle", "Idle");
      captureWorkflowSnapshot(workflowId);
      await syncActivities();
      rankActionsForOutcome("executive");
      return;
    }

    if (store.selectedAgent === "orchestrator") {
      store.setActiveAgent("retrieving_memory", stageLabel("retrieving_memory"));
      try {
        const routed = await runMultiAgentRoute({
          accessToken,
          query,
          topK: 3,
        });

        store.addMessage({
          id: createId("msg-assistant"),
          kind: "assistant",
          createdAt: new Date().toISOString(),
          markdown: `### Multi-Agent Routing\n\n${routed.route.map((step) => `- ${step}`).join("\n")}`,
        });

        if (routed.research) {
          store.setActiveAgent("researching_web", stageLabel("researching_web"));
          store.addMessage({
            id: createId("msg-assistant"),
            kind: "assistant",
            createdAt: new Date().toISOString(),
            markdown: `### Research Brief\n\n${routed.research.summary}`,
          });
          store.addMessage({
            id: createId("msg-research"),
            kind: "research",
            createdAt: new Date().toISOString(),
            research: routed.research,
          });
          store.setContextResearch(
            routed.research.sources.map((source, index) => ({
              id: `${source.title}-${index}`,
              title: source.title,
              sourceLabel: source.source_label,
              snippet: source.snippet,
            })),
          );
        }

        if (routed.content) {
          store.setActiveAgent("generating_response", stageLabel("generating_response"));
          store.addMessage({
            id: createId("msg-assistant"),
            kind: "assistant",
            createdAt: new Date().toISOString(),
            markdown: `### Draft Ready\n\n${routed.content.title}`,
          });

          if (routed.content.format === "linkedin") {
            store.addMessage({
              id: createId("msg-linkedin"),
              kind: "linkedin_post",
              createdAt: new Date().toISOString(),
              content: routed.content,
              status: "approval_required",
              busy: false,
              error: "",
              linkedinPostUrl: null,
            });
          }

          store.addMessage({
            id: createId("msg-approval"),
            kind: "approval",
            createdAt: new Date().toISOString(),
            generationId: routed.content.generation_id,
            status: "approval_required",
            busy: false,
            error: "",
            channel: routed.content.format === "linkedin" ? "linkedin" : "internal",
            linkedinPostUrl: null,
          });
        }

        if (routed.executive) {
          store.setActiveAgent("preparing_output", stageLabel("preparing_output"));
          store.addMessage({
            id: createId("msg-assistant"),
            kind: "assistant",
            createdAt: new Date().toISOString(),
            markdown: `### Executive Summary\n\n${routed.executive.response}`,
            citations: routed.executive.citations,
          });
          if (routed.executive.citations.length) {
            store.setContextMemory(toContextMemory(routed.executive.citations));
          }
        }

        if (routed.suggested_actions?.length) {
          store.setSuggestedActions(normalizeSuggestedActions(routed.suggested_actions));
        }
      } catch (error) {
        const detail = error instanceof Error ? error.message : "Multi-agent routing failed";
        store.setComposerError(detail);
      }

      store.setSending(false);
      store.setActiveAgent("idle", "Idle");
      captureWorkflowSnapshot(workflowId);
      await syncActivities();
      rankActionsForOutcome("orchestrator");
      return;
    }

    if (store.selectedAgent === "research") {
      store.setActiveAgent("retrieving_memory", stageLabel("retrieving_memory"));
      try {
        store.setActiveAgent("researching_web", stageLabel("researching_web"));
        const research = await runResearchAgent({
          accessToken,
          query,
          topK: 3,
        });

        store.setActiveAgent("preparing_output", stageLabel("preparing_output"));

        store.addMessage({
          id: createId("msg-assistant"),
          kind: "assistant",
          createdAt: new Date().toISOString(),
          markdown: `### Research Brief\n\n${research.summary}`,
        });
        store.addMessage({
          id: createId("msg-research"),
          kind: "research",
          createdAt: new Date().toISOString(),
          research,
        });
        const contextResearch: ContextResearchItem[] = research.sources.map((source, index) => ({
          id: `${source.title}-${index}`,
          title: source.title,
          sourceLabel: source.source_label,
          snippet: source.snippet,
        }));
        store.setContextResearch(contextResearch);
      } catch {
        const mock = mockResearchResponse(query);
        store.addMessage({
          id: createId("msg-assistant"),
          kind: "assistant",
          createdAt: new Date().toISOString(),
          markdown: `### Research Brief\n\n${mock.summary}`,
        });
        store.addMessage({
          id: createId("msg-research"),
          kind: "research",
          createdAt: new Date().toISOString(),
          research: mock,
        });
      }

      store.setSending(false);
      store.setActiveAgent("idle", "Idle");
      captureWorkflowSnapshot(workflowId);
      await syncActivities();
      rankActionsForOutcome("research");
      return;
    }

    store.setActiveAgent("retrieving_memory", stageLabel("retrieving_memory"));
    try {
      store.setActiveAgent("generating_response", stageLabel("generating_response"));
      const content = await runContentAgent({
        accessToken,
        query,
        format: store.contentFormat,
        tone: store.contentTone,
        length: store.contentLength,
        generateImage: store.contentFormat === "linkedin" ? store.contentImageEnabled : false,
        topK: 3,
      });

      store.setActiveAgent("preparing_output", stageLabel("preparing_output"));

      store.addMessage({
        id: createId("msg-assistant"),
        kind: "assistant",
        createdAt: new Date().toISOString(),
        markdown: `### Draft Ready\n\n${content.title}`,
      });

      const cardKind = content.format === "linkedin" ? "linkedin_post" : "approval";
      if (cardKind === "linkedin_post") {
        store.addMessage({
          id: createId("msg-linkedin"),
          kind: "linkedin_post",
          createdAt: new Date().toISOString(),
          content,
          status: "approval_required",
          busy: false,
          error: "",
          linkedinPostUrl: null,
        });
      }

      store.addMessage({
        id: createId("msg-approval"),
        kind: "approval",
        createdAt: new Date().toISOString(),
        generationId: content.generation_id,
        status: "approval_required",
        busy: false,
        error: "",
        channel: content.format === "linkedin" ? "linkedin" : "internal",
        linkedinPostUrl: null,
      });

      const memoryItems = content.sources
        .filter((source) => source.source_type === "memory")
        .map((source, index) => ({
          id: `${source.title}-${index}`,
          title: source.title,
          scoreLabel: "89%",
          sourceLabel: source.source_label,
          snippet: source.snippet,
        }));
      store.setContextMemory(memoryItems);
      if (content.context_labels.length > 0) {
        store.setContextBadges(content.context_labels);
      }
    } catch {
      const mock = mockContentResponse(query);
      store.addMessage({
        id: createId("msg-assistant"),
        kind: "assistant",
        createdAt: new Date().toISOString(),
        markdown: `### Draft Ready\n\n${mock.title}`,
      });
      store.addMessage({
        id: createId("msg-linkedin"),
        kind: "linkedin_post",
        createdAt: new Date().toISOString(),
        content: mock,
        status: "approval_required",
        busy: false,
        error: "",
        linkedinPostUrl: null,
      });
      store.addMessage({
        id: createId("msg-approval"),
        kind: "approval",
        createdAt: new Date().toISOString(),
        generationId: mock.generation_id,
        status: "approval_required",
        busy: false,
        error: "",
        channel: "linkedin",
        linkedinPostUrl: null,
      });
    }

    store.setSending(false);
    store.setActiveAgent("idle", "Idle");
    captureWorkflowSnapshot(workflowId);
    await syncActivities();
    rankActionsForOutcome("content");
  }

  function patchGenerationCards(
    generationId: string,
    patch: { status?: WorkflowDraftStatus; busy?: boolean; error?: string; linkedinPostUrl?: string | null },
  ) {
    store.setMessages(
      store.messages.map((message) => {
        if (message.kind === "linkedin_post" && message.content.generation_id === generationId) {
          return { ...message, ...patch };
        }
        if (message.kind === "approval" && message.generationId === generationId) {
          return { ...message, ...patch };
        }
        return message;
      }),
    );
  }

  async function approveDraft(generationId: string) {
    patchGenerationCards(generationId, { busy: true, error: "" });
    if (isLocalFallbackGeneration(generationId)) {
      patchGenerationCards(generationId, { status: "approved", busy: false, error: "" });
      return;
    }
    if (!accessToken) {
      patchGenerationCards(generationId, { busy: false, error: "Sign in required" });
      return;
    }
    try {
      await approveGeneration({ accessToken, generationId });
      patchGenerationCards(generationId, { status: "approved", busy: false });
      if (activeWorkflowId) {
        captureWorkflowSnapshot(activeWorkflowId);
      }
      await syncActivities();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Approve failed";
      patchGenerationCards(generationId, { busy: false, error: detail });
    }
  }

  async function rejectDraft(generationId: string) {
    patchGenerationCards(generationId, { busy: true, error: "" });
    if (isLocalFallbackGeneration(generationId)) {
      patchGenerationCards(generationId, { status: "rejected", busy: false, error: "" });
      return;
    }
    if (!accessToken) {
      patchGenerationCards(generationId, { busy: false, error: "Sign in required" });
      return;
    }
    try {
      await rejectGeneration({ accessToken, generationId, reason: "Request edits from workspace" });
      patchGenerationCards(generationId, { status: "rejected", busy: false });
      if (activeWorkflowId) {
        captureWorkflowSnapshot(activeWorkflowId);
      }
      await syncActivities();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Reject failed";
      patchGenerationCards(generationId, { busy: false, error: detail });
    }
  }

  async function publishDraft(generationId: string, channel: "linkedin" | "internal") {
    patchGenerationCards(generationId, { busy: true, error: "" });
    if (isLocalFallbackGeneration(generationId)) {
      patchGenerationCards(generationId, {
        status: "published",
        busy: false,
        error: "",
        linkedinPostUrl: channel === "linkedin" ? null : undefined,
      });
      return;
    }
    if (!accessToken) {
      patchGenerationCards(generationId, { busy: false, error: "Sign in required" });
      return;
    }
    try {
      if (channel === "linkedin") {
        const result = await publishLinkedIn({ accessToken, generationId });
        patchGenerationCards(generationId, {
          status: "published",
          busy: false,
          linkedinPostUrl: result.linkedin_post_url,
        });
      } else {
        await publishGeneration({ accessToken, generationId });
        patchGenerationCards(generationId, { status: "published", busy: false });
      }
      if (activeWorkflowId) {
        captureWorkflowSnapshot(activeWorkflowId);
      }
      await syncActivities();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Publish failed";
      patchGenerationCards(generationId, { busy: false, error: detail });
    }
  }

  function saveDraft(generationId: string) {
    patchGenerationCards(generationId, { status: "saved_draft" as WorkflowDraftStatus, error: "" });
    if (activeWorkflowId) {
      captureWorkflowSnapshot(activeWorkflowId);
    }
  }

  async function connectLinkedInAccount(forceReconnect: boolean) {
    if (!accessToken) {
      return;
    }
    store.setLinkedInBusy(true);
    store.setLinkedInError("");
    try {
      const response = await connectLinkedIn({ accessToken, step: "start", forceReconnect });
      store.setLinkedInStatus(normalizeLinkedInStatus(response.connection_status), response.connected_at || "");
      if (response.authorization_url && typeof window !== "undefined") {
        window.location.assign(response.authorization_url);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "LinkedIn connect failed";
      store.setLinkedInError(detail);
    } finally {
      store.setLinkedInBusy(false);
    }
  }

  async function processMemoryUpload(files: FileList, mode: "upload" | "train") {
    const fileItems = Array.from(files).map((file) => ({
      id: createId("file"),
      name: file.name,
      size: file.size,
    }));
    store.setUploadedFiles(fileItems);
    store.setActiveAgent("retrieving_memory", stageLabel("retrieving_memory"));

    const previousProfile = useFounderosDashboardStore.getState().founderProfile;

    try {
      for (const file of Array.from(files)) {
        await uploadMemoryDocument({
          accessToken,
          file,
          sourceLabel: mode === "train" ? "Training Corpus" : "Founder Notes",
        });
      }
      const documents = await listMemoryDocuments({ accessToken });
      store.setDocuments(documents.items);

      try {
        const intel = await getFounderIntelligence({ accessToken });
        store.setFounderProfile(intel.profile);
        store.setFounderInsights(intel.insights || []);
        store.setSuggestedActions(normalizeSuggestedActions(intel.suggested_actions || []));
        store.setKnowledgeGraph(intel.knowledge_graph?.nodes || [], intel.knowledge_graph?.edges || []);
        store.setFounderBrief(buildDailyFounderBrief(useFounderosDashboardStore.getState()));

        const memoryDiff = buildMemoryDiff(previousProfile, intel.profile);
        if (memoryDiff.length > 0) {
          store.addMessage({
            id: createId("msg-assistant"),
            kind: "assistant",
            createdAt: new Date().toISOString(),
            markdown: `### Changes Detected\n\n${memoryDiff.map((item) => `+ ${item}`).join("\n")}`,
          });
        }

        const memoryUpdates = (intel.insights || []).slice(0, 3).map((item) => `- ${item}`).join("\n");
        if (memoryUpdates) {
          store.addMessage({
            id: createId("msg-assistant"),
            kind: "assistant",
            createdAt: new Date().toISOString(),
            markdown:
              mode === "train"
                ? `### FounderOS Training Complete\n\n- Founder tone updated\n- AI understanding improved\n- Memory expanded\n\n${memoryUpdates}`
                : `### Memory Updated\n\n${memoryUpdates}`,
          });
        }
      } catch {
        // Ignore founder intelligence refresh errors during upload.
      }

      await syncActivities();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Failed to upload document";
      store.setComposerError(detail);
    } finally {
      store.clearUploadedFiles();
      store.setActiveAgent("idle", "Idle");
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0 || !accessToken) {
      return;
    }
    await processMemoryUpload(files, "upload");
  }

  async function trainFounderos(files: FileList | null) {
    if (!files || files.length === 0 || !accessToken) {
      return;
    }

    store.addMessage({
      id: createId("msg-assistant"),
      kind: "assistant",
      createdAt: new Date().toISOString(),
      markdown: "### Train FounderOS\n\nProcessing old posts, pitch decks, and strategy docs...",
    });

    await processMemoryUpload(files, "train");
  }

  async function transcribeAudio(file: File) {
    if (!accessToken) {
      store.setVoiceError("Sign in required");
      store.setVoiceStatus("idle");
      return;
    }

    store.setVoiceStatus("transcribing");
    store.setVoiceError("");

    try {
      const result = await transcribeVoice({
        accessToken,
        file,
      });

      const transcript = result.transcript.trim();
      if (!transcript) {
        throw new Error("Transcription returned empty text");
      }

      applyVoiceTranscript(transcript);
      store.setVoiceStatus("idle");
      await syncActivities();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Voice transcription failed";
      store.setVoiceError(detail);
      store.setVoiceStatus("idle");
    }
  }

  function applyVoiceTranscript(transcript: string) {
    const normalized = transcript.trim();
    if (!normalized) {
      store.setVoiceError("Transcription returned empty text");
      return;
    }
    const mergedInput = mergeTranscriptIntoInput(store.input, normalized);
    store.setVoicePreview(normalized);
    store.setVoiceError("");
    store.setInput(mergedInput);
  }

  function applySuggestedAction(actionIdRaw: string) {
    const actionId = actionIdRaw as SuggestedActionId;
    if (actionId === "launch_post") {
      store.setSelectedAgent("content");
      store.setContentFormat("launch_post");
      store.setContentImageEnabled(false);
      store.setContentTone("bold");
      store.setContentLength("medium");
      store.setInput("Generate a launch announcement post using my uploaded company context.");
      return;
    }

    if (actionId === "summarize_notes") {
      store.setSelectedAgent("executive");
      store.setInput("Summarize my uploaded startup notes into clear action items.");
      return;
    }

    if (actionId === "research_competitors") {
      store.setSelectedAgent("research");
      store.setInput("Research my competitors and summarize key positioning gaps.");
      return;
    }

    if (actionId === "founder_thread") {
      store.setSelectedAgent("content");
      store.setContentFormat("x_post");
      store.setContentImageEnabled(false);
      store.setContentTone("bold");
      store.setContentLength("short");
      store.setInput("Draft a concise founder thread summarizing this week’s progress and next priorities.");
      return;
    }

    if (actionId === "competitor_response") {
      store.setSelectedAgent("executive");
      store.setInput("Create a concise counter-positioning memo against the latest competitor launch.");
      return;
    }

    if (actionId === "save_memory") {
      store.setSelectedAgent("executive");
      store.setInput("Summarize this output into reusable memory snippets and founder operating principles.");
      return;
    }

    store.setSelectedAgent("content");
    store.setContentFormat("founder_update");
    store.setContentImageEnabled(false);
    store.setContentTone("professional");
    store.setContentLength("short");
    store.setInput("Create an investor update using my latest company notes and research context.");
  }

  async function searchFounderMemory(query: string) {
    const normalized = query.trim();
    setMemorySearchQuery(normalized);
    if (!normalized) {
      setMemorySearchItems([]);
      setMemorySearchError("");
      return;
    }
    if (normalized.length < 2 || !accessToken) {
      return;
    }

    setMemorySearchBusy(true);
    setMemorySearchError("");
    try {
      const result = await searchMemoryChunks({
        accessToken,
        query: normalized,
        topK: 6,
      });
      setMemorySearchItems(result.items);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Memory search unavailable";
      setMemorySearchError(detail);
      setMemorySearchItems([]);
    } finally {
      setMemorySearchBusy(false);
    }
  }

  return {
    accessToken,
    user,
    store,
    workflowHistory,
    activeWorkflowId,
    activeSidebarNav,
    startNewWorkflow,
    openWorkflow,
    selectSidebarNav,
    sendMessage,
    approveDraft,
    rejectDraft,
    publishDraft,
    saveDraft,
    connectLinkedInAccount,
    uploadFiles,
    trainFounderos,
    searchFounderMemory,
    memorySearchQuery,
    memorySearchBusy,
    memorySearchError,
    memorySearchItems,
    transcribeAudio,
    applyVoiceTranscript,
    applySuggestedAction,
  };
}
