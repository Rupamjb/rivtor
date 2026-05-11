import type { ActivityFeedItem } from "@/lib/activities-feed";
import type { ChatCitation } from "@/lib/chat";
import type { MemoryDocument, MemorySearchItem } from "@/lib/company-brain";
import type { ContentAgentResponse, ContentFormat } from "@/lib/content-agent";
import type { ResearchAgentResponse } from "@/lib/research-agent";


export type AgentMode = "executive" | "research" | "content" | "orchestrator";

export type ActiveAgentStage =
  | "idle"
  | "retrieving_memory"
  | "researching_web"
  | "generating_response"
  | "preparing_output";

export type WorkflowDraftStatus =
  | "approval_required"
  | "approved"
  | "rejected"
  | "published"
  | "saved_draft";

export type SidebarNavItem = {
  id: string;
  label: string;
};

export type WorkflowHistoryItem = {
  id: string;
  title: string;
  timestamp: string;
};

export type DashboardMessage =
  | {
      id: string;
      kind: "user";
      createdAt: string;
      text: string;
    }
  | {
      id: string;
      kind: "assistant";
      createdAt: string;
      markdown: string;
      streaming?: boolean;
      citations?: ChatCitation[];
    }
  | {
      id: string;
      kind: "research";
      createdAt: string;
      research: ResearchAgentResponse;
    }
  | {
      id: string;
      kind: "linkedin_post";
      createdAt: string;
      content: ContentAgentResponse;
      status: WorkflowDraftStatus;
      busy: boolean;
      error: string;
      linkedinPostUrl: string | null;
    }
  | {
      id: string;
      kind: "approval";
      createdAt: string;
      generationId: string;
      status: WorkflowDraftStatus;
      busy: boolean;
      error: string;
      channel: "linkedin" | "internal";
      linkedinPostUrl: string | null;
    }
  | {
      id: string;
      kind: "memory";
      createdAt: string;
      title: string;
      items: MemorySearchItem[];
    };

export type ContextMemoryItem = {
  id: string;
  title: string;
  scoreLabel: string;
  sourceLabel: string;
  snippet: string;
};

export type ContextResearchItem = {
  id: string;
  title: string;
  sourceLabel: string;
  snippet: string;
};

export type UploadedFileItem = {
  id: string;
  name: string;
  size: number;
};

export type FounderProfile = {
  startup_name: string;
  mission: string;
  positioning: string;
  audience: string;
  tone: string;
  competitors: string[];
  goals: string[];
  keywords: string[];
};

export type FounderBrief = {
  title: string;
  highlights: string[];
  suggested_action: string;
};

export type SuggestedAction = {
  id: string;
  label: string;
  prompt: string;
  reason: string;
};

export type StartupRadar = {
  title: string;
  items: string[];
  suggested_action: string;
  generated_at: string;
};

export type KnowledgeGraphNode = {
  id: string;
  label: string;
  kind: "memory" | "strategy" | "output";
};

export type KnowledgeGraphEdge = {
  from: string;
  to: string;
};

export type VoiceComposerStatus = "idle" | "recording" | "transcribing";

export type FounderosDashboardState = {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  rightPanelOpen: boolean;
  input: string;
  selectedAgent: AgentMode;
  contentFormat: ContentFormat;
  contentImageEnabled: boolean;
  contentTone: "professional" | "bold" | "insightful" | "casual";
  contentLength: "short" | "medium" | "long";
  sending: boolean;
  activeAgentStage: ActiveAgentStage;
  activeAgentLabel: string;
  composerError: string;
  messages: DashboardMessage[];
  recentWorkflows: WorkflowHistoryItem[];
  contextMemory: ContextMemoryItem[];
  contextResearch: ContextResearchItem[];
  contextBadges: string[];
  activities: ActivityFeedItem[];
  documents: MemoryDocument[];
  uploadedFiles: UploadedFileItem[];
  founderProfile: FounderProfile | null;
  founderBrief: FounderBrief | null;
  founderInsights: string[];
  suggestedActions: SuggestedAction[];
  knowledgeGraphNodes: KnowledgeGraphNode[];
  knowledgeGraphEdges: KnowledgeGraphEdge[];
  startupRadar: StartupRadar | null;
  linkedInStatus: "disconnected" | "connecting" | "connected";
  linkedInConnectedAt: string;
  linkedInBusy: boolean;
  linkedInError: string;
  voiceStatus: VoiceComposerStatus;
  voicePreview: string;
  voiceError: string;
};
