import { create } from "zustand";

import type {
  ActiveAgentStage,
  AgentMode,
  ContextMemoryItem,
  ContextResearchItem,
  DashboardMessage,
  FounderosDashboardState,
  WorkflowHistoryItem,
} from "@/types/founderos-dashboard";
import type { ActivityFeedItem } from "@/lib/activities-feed";
import type { MemoryDocument } from "@/lib/company-brain";


type FounderosDashboardActions = {
  setSidebarCollapsed: (value: boolean) => void;
  setSidebarMobileOpen: (value: boolean) => void;
  setRightPanelOpen: (value: boolean) => void;
  setInput: (value: string) => void;
  setSelectedAgent: (value: AgentMode) => void;
  setContentFormat: (value: FounderosDashboardState["contentFormat"]) => void;
  setContentImageEnabled: (value: boolean) => void;
  setContentTone: (value: FounderosDashboardState["contentTone"]) => void;
  setContentLength: (value: FounderosDashboardState["contentLength"]) => void;
  setSending: (value: boolean) => void;
  setActiveAgent: (stage: ActiveAgentStage, label: string) => void;
  setComposerError: (value: string) => void;
  addMessage: (message: DashboardMessage) => void;
  replaceMessage: (messageId: string, message: DashboardMessage) => void;
  patchMessage: (messageId: string, patch: Partial<DashboardMessage>) => void;
  setMessages: (messages: DashboardMessage[]) => void;
  clearConversation: () => void;
  addRecentWorkflow: (item: WorkflowHistoryItem) => void;
  setContextMemory: (items: ContextMemoryItem[]) => void;
  setContextResearch: (items: ContextResearchItem[]) => void;
  setContextBadges: (badges: string[]) => void;
  setActivities: (items: ActivityFeedItem[]) => void;
  setDocuments: (items: MemoryDocument[]) => void;
  setUploadedFiles: (items: FounderosDashboardState["uploadedFiles"]) => void;
  setFounderProfile: (profile: FounderosDashboardState["founderProfile"]) => void;
  setFounderBrief: (brief: FounderosDashboardState["founderBrief"]) => void;
  setFounderInsights: (items: string[]) => void;
  setSuggestedActions: (items: FounderosDashboardState["suggestedActions"]) => void;
  setKnowledgeGraph: (
    nodes: FounderosDashboardState["knowledgeGraphNodes"],
    edges: FounderosDashboardState["knowledgeGraphEdges"],
  ) => void;
  setStartupRadar: (radar: FounderosDashboardState["startupRadar"]) => void;
  clearUploadedFiles: () => void;
  setLinkedInStatus: (status: FounderosDashboardState["linkedInStatus"], connectedAt?: string) => void;
  setLinkedInBusy: (value: boolean) => void;
  setLinkedInError: (value: string) => void;
  setVoiceStatus: (value: FounderosDashboardState["voiceStatus"]) => void;
  setVoicePreview: (value: string) => void;
  setVoiceError: (value: string) => void;
  clearVoice: () => void;
};

export type FounderosDashboardStore = FounderosDashboardState & FounderosDashboardActions;

const initialRecentWorkflows: WorkflowHistoryItem[] = [
  { id: "wf-1", title: "AI Competitor Research", timestamp: "2m ago" },
  { id: "wf-2", title: "LinkedIn Launch Post", timestamp: "15m ago" },
  { id: "wf-3", title: "Investor Summary", timestamp: "1h ago" },
  { id: "wf-4", title: "Product Strategy Analysis", timestamp: "Yesterday" },
];

export const useFounderosDashboardStore = create<FounderosDashboardStore>((set) => ({
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  rightPanelOpen: true,
  input: "",
  selectedAgent: "executive",
  contentFormat: "linkedin",
  contentImageEnabled: true,
  contentTone: "professional",
  contentLength: "medium",
  sending: false,
  activeAgentStage: "idle",
  activeAgentLabel: "Idle",
  composerError: "",
  messages: [],
  recentWorkflows: initialRecentWorkflows,
  contextMemory: [],
  contextResearch: [],
  contextBadges: ["Founder Notes", "Product Context", "Investor Pitch", "AI Trends"],
  activities: [],
  documents: [],
  uploadedFiles: [],
  founderProfile: null,
  founderBrief: null,
  founderInsights: [],
  suggestedActions: [],
  knowledgeGraphNodes: [],
  knowledgeGraphEdges: [],
  startupRadar: null,
  linkedInStatus: "disconnected",
  linkedInConnectedAt: "",
  linkedInBusy: false,
  linkedInError: "",
  voiceStatus: "idle",
  voicePreview: "",
  voiceError: "",

  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
  setSidebarMobileOpen: (value) => set({ sidebarMobileOpen: value }),
  setRightPanelOpen: (value) => set({ rightPanelOpen: value }),
  setInput: (value) => set({ input: value }),
  setSelectedAgent: (value) => set({ selectedAgent: value }),
  setContentFormat: (value) => set({ contentFormat: value }),
  setContentImageEnabled: (value) => set({ contentImageEnabled: value }),
  setContentTone: (value) => set({ contentTone: value }),
  setContentLength: (value) => set({ contentLength: value }),
  setSending: (value) => set({ sending: value }),
  setActiveAgent: (stage, label) => set({ activeAgentStage: stage, activeAgentLabel: label }),
  setComposerError: (value) => set({ composerError: value }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  replaceMessage: (messageId, message) =>
    set((state) => ({
      messages: state.messages.map((existing) => (existing.id === messageId ? message : existing)),
    })),
  patchMessage: (messageId, patch) =>
    set((state) => ({
      messages: state.messages.map((message) => (message.id === messageId ? ({ ...message, ...patch } as DashboardMessage) : message)),
    })),
  setMessages: (messages) => set({ messages }),
  clearConversation: () =>
    set({
      input: "",
      sending: false,
      composerError: "",
      activeAgentStage: "idle",
      activeAgentLabel: "Idle",
      messages: [],
      contextMemory: [],
      contextResearch: [],
      founderBrief: null,
      voiceStatus: "idle",
      voicePreview: "",
      voiceError: "",
    }),
  addRecentWorkflow: (item) =>
    set((state) => ({
      recentWorkflows: [item, ...state.recentWorkflows.filter((workflow) => workflow.id !== item.id)].slice(0, 10),
    })),
  setContextMemory: (items) => set({ contextMemory: items }),
  setContextResearch: (items) => set({ contextResearch: items }),
  setContextBadges: (badges) => set({ contextBadges: badges }),
  setActivities: (items) => set({ activities: items }),
  setDocuments: (items) => set({ documents: items }),
  setUploadedFiles: (items) => set({ uploadedFiles: items }),
  setFounderProfile: (profile) => set({ founderProfile: profile }),
  setFounderBrief: (brief) => set({ founderBrief: brief }),
  setFounderInsights: (items) => set({ founderInsights: items }),
  setSuggestedActions: (items) => set({ suggestedActions: items }),
  setKnowledgeGraph: (nodes, edges) => set({ knowledgeGraphNodes: nodes, knowledgeGraphEdges: edges }),
  setStartupRadar: (radar) => set({ startupRadar: radar }),
  clearUploadedFiles: () => set({ uploadedFiles: [] }),
  setLinkedInStatus: (status, connectedAt = "") => set({ linkedInStatus: status, linkedInConnectedAt: connectedAt }),
  setLinkedInBusy: (value) => set({ linkedInBusy: value }),
  setLinkedInError: (value) => set({ linkedInError: value }),
  setVoiceStatus: (value) => set({ voiceStatus: value }),
  setVoicePreview: (value) => set({ voicePreview: value }),
  setVoiceError: (value) => set({ voiceError: value }),
  clearVoice: () => set({ voiceStatus: "idle", voicePreview: "", voiceError: "" }),
}));
