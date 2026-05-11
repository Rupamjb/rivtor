import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/context/AuthContext";
import Workspace from "@/legacy/pages/Workspace";
import { useFounderosDashboardStore } from "@/store/founderos-dashboard-store";


const { streamChatQueryMock } = vi.hoisted(() => ({
  streamChatQueryMock: vi.fn(),
}));

const { runResearchAgentMock } = vi.hoisted(() => ({
  runResearchAgentMock: vi.fn(),
}));

const { runContentAgentMock } = vi.hoisted(() => ({
  runContentAgentMock: vi.fn(),
}));

const { approveGenerationMock, rejectGenerationMock, publishGenerationMock } = vi.hoisted(() => ({
  approveGenerationMock: vi.fn(),
  rejectGenerationMock: vi.fn(),
  publishGenerationMock: vi.fn(),
}));

const { listActivitiesFeedMock } = vi.hoisted(() => ({
  listActivitiesFeedMock: vi.fn(),
}));

const { connectLinkedInMock, linkedinConnectionStatusMock, publishLinkedInMock } = vi.hoisted(() => ({
  connectLinkedInMock: vi.fn(),
  linkedinConnectionStatusMock: vi.fn(),
  publishLinkedInMock: vi.fn(),
}));

const { listMemoryDocumentsMock, uploadMemoryDocumentMock } = vi.hoisted(() => ({
  listMemoryDocumentsMock: vi.fn(),
  uploadMemoryDocumentMock: vi.fn(),
}));

const { transcribeVoiceMock } = vi.hoisted(() => ({
  transcribeVoiceMock: vi.fn(),
}));

vi.mock("@/lib/chat", async () => {
  const actual = await vi.importActual<typeof import("@/lib/chat")>("@/lib/chat");
  return { ...actual, streamChatQuery: streamChatQueryMock };
});

vi.mock("@/lib/research-agent", async () => {
  const actual = await vi.importActual<typeof import("@/lib/research-agent")>("@/lib/research-agent");
  return { ...actual, runResearchAgent: runResearchAgentMock };
});

vi.mock("@/lib/content-agent", async () => {
  const actual = await vi.importActual<typeof import("@/lib/content-agent")>("@/lib/content-agent");
  return { ...actual, runContentAgent: runContentAgentMock };
});

vi.mock("@/lib/approvals", async () => {
  const actual = await vi.importActual<typeof import("@/lib/approvals")>("@/lib/approvals");
  return {
    ...actual,
    approveGeneration: approveGenerationMock,
    rejectGeneration: rejectGenerationMock,
    publishGeneration: publishGenerationMock,
  };
});

vi.mock("@/lib/activities-feed", async () => {
  const actual = await vi.importActual<typeof import("@/lib/activities-feed")>("@/lib/activities-feed");
  return { ...actual, listActivitiesFeed: listActivitiesFeedMock };
});

vi.mock("@/lib/linkedin", async () => {
  const actual = await vi.importActual<typeof import("@/lib/linkedin")>("@/lib/linkedin");
  return {
    ...actual,
    connectLinkedIn: connectLinkedInMock,
    linkedinConnectionStatus: linkedinConnectionStatusMock,
    publishLinkedIn: publishLinkedInMock,
  };
});

vi.mock("@/lib/company-brain", async () => {
  const actual = await vi.importActual<typeof import("@/lib/company-brain")>("@/lib/company-brain");
  return {
    ...actual,
    listMemoryDocuments: listMemoryDocumentsMock,
    uploadMemoryDocument: uploadMemoryDocumentMock,
  };
});

vi.mock("@/lib/voice", async () => {
  const actual = await vi.importActual<typeof import("@/lib/voice")>("@/lib/voice");
  return {
    ...actual,
    transcribeVoice: transcribeVoiceMock,
  };
});

function renderWithAuth(value?: Partial<AuthContextValue>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const base: AuthContextValue = {
    user: { id: "user-1", email: "founder@example.com" },
    session: { access_token: "token" },
    loading: false,
    signIn: vi.fn().mockResolvedValue({}),
    signUp: vi.fn().mockResolvedValue({}),
    signOut: vi.fn().mockResolvedValue(undefined),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{ ...base, ...value }}>
        <Workspace />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe("FounderOS dashboard workspace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }, "SpeechRecognition");
    Reflect.deleteProperty(window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }, "webkitSpeechRecognition");
    useFounderosDashboardStore.setState({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      rightPanelOpen: true,
      input: "",
      selectedAgent: "executive",
      contentFormat: "linkedin",
      contentTone: "professional",
      contentLength: "medium",
      sending: false,
      activeAgentStage: "idle",
      activeAgentLabel: "Idle",
      composerError: "",
      messages: [],
      contextMemory: [],
      contextResearch: [],
      contextBadges: ["Founder Notes", "Product Context", "Investor Pitch", "AI Trends"],
      activities: [],
      documents: [],
      uploadedFiles: [],
      linkedInStatus: "disconnected",
      linkedInConnectedAt: "",
      linkedInBusy: false,
      linkedInError: "",
      voiceStatus: "idle",
      voicePreview: "",
      voiceError: "",
    });
    listActivitiesFeedMock.mockResolvedValue({ items: [] });
    listMemoryDocumentsMock.mockResolvedValue({ items: [] });
    linkedinConnectionStatusMock.mockResolvedValue({
      step: "status",
      connection_status: "disconnected",
      linkedin_member_urn: null,
      connected_at: null,
    });
  });

  function selectAgentMode(modeLabel: "Executive" | "Research" | "Content") {
    fireEvent.click(screen.getByLabelText("Agent mode"));
    fireEvent.click(screen.getByRole("option", { name: modeLabel }));
  }

  it("renders chatgpt-style shell with sidebar, composer, and context panel", async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("FounderOS")).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /New Workflow/i }).length).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute...")).toBeInTheDocument();
      expect(screen.getByText("Active Memory")).toBeInTheDocument();
      expect(screen.getByText("Activity Feed")).toBeInTheDocument();
      expect(screen.getByText("Uploaded Documents")).toBeInTheDocument();
      expect(screen.getByText("No uploaded documents yet.")).toBeInTheDocument();
    });
  });

  it("opens recent workflow item and prefills continuation prompt", async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /AI Competitor Research/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /AI Competitor Research/i }));

    const composer = screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute...") as HTMLTextAreaElement;
    expect(composer.value).toBe("Continue workflow: AI Competitor Research");
  });

  it("makes sidebar nav actions actually update workspace state", async () => {
    renderWithAuth();

    fireEvent.click(screen.getByRole("button", { name: /Agents/i }));
    const composer = screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute...") as HTMLTextAreaElement;
    expect(composer.value).toContain("multi-agent route");

    fireEvent.click(screen.getByRole("button", { name: /Outputs/i }));
    expect(composer.value).toContain("high-impact founder output");

    fireEvent.click(screen.getByRole("button", { name: /Activity/i }));
    expect(composer.value).toContain("Summarize my recent FounderOS activity");
  });

  it("shows suggested actions after documents are uploaded", async () => {
    useFounderosDashboardStore.setState({
      documents: [
        {
          id: "doc-1",
          file_name: "founder-notes.txt",
          source_label: "Founder Notes",
          vector_id: "vec-doc-1",
          created_at: "2026-05-11T12:00:00Z",
        },
      ],
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("Suggested Actions")).toBeInTheDocument();
      expect(screen.getByText("founder-notes.txt")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Research competitors" }));

    const composer = screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute...") as HTMLTextAreaElement;
    expect(composer.value).toBe("Research my competitors and summarize key positioning gaps.");
  });

  it("keeps suggested actions visible after conversation starts", async () => {
    useFounderosDashboardStore.setState({
      documents: [
        {
          id: "doc-1",
          file_name: "founder-notes.txt",
          source_label: "Founder Notes",
          vector_id: "vec-doc-1",
          created_at: "2026-05-11T12:00:00Z",
        },
      ],
      messages: [
        {
          id: "msg-1",
          kind: "assistant",
          createdAt: "2026-05-11T12:10:00Z",
          markdown: "Existing conversation",
        },
      ],
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText("Suggested Actions")).toBeInTheDocument();
      expect(screen.getByText("Generate launch post")).toBeInTheDocument();
    });
  });

  it("renders generated LinkedIn image preview when content includes image data", async () => {
    useFounderosDashboardStore.setState({
      messages: [
        {
          id: "msg-linkedin-1",
          kind: "linkedin_post",
          createdAt: "2026-05-11T12:00:00Z",
          content: {
            generation_id: "gen-1",
            agent_type: "content",
            status: "approval_required",
            approval_required: true,
            query: "write linkedin post",
            format: "linkedin",
            tone: "professional",
            length: "medium",
            title: "Launch Visual",
            draft: "Draft copy",
            image_data_url: "data:image/png;base64,ZmFrZQ==",
            context_labels: ["Founder Notes"],
            sources: [],
            created_at: "2026-05-11T12:00:00Z",
          },
          status: "approval_required",
          busy: false,
          error: "",
          linkedinPostUrl: null,
        },
      ],
    });

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByAltText("AI generated post visual")).toBeInTheDocument();
    });
  });

  it("triggers sign out from sidebar action", async () => {
    const signOutMock = vi.fn().mockResolvedValue(undefined);
    renderWithAuth({ signOut: signOutMock });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows a sign out control when the sidebar is collapsed", async () => {
    const signOutMock = vi.fn().mockResolvedValue(undefined);
    useFounderosDashboardStore.setState({ sidebarCollapsed: true });

    renderWithAuth({ signOut: signOutMock });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Quick sign out" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick sign out" }));

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });
  });

  it("streams executive response tokens into assistant markdown", async () => {
    streamChatQueryMock.mockImplementationOnce(async ({ onEvent }) => {
      onEvent({ type: "status", stage: "retrieving_memory" });
      onEvent({ type: "token", token: "FounderOS " });
      onEvent({ type: "token", token: "response" });
      onEvent({
        type: "citations",
        items: [
          {
            source_label: "Founder Notes",
            file_name: "notes.md",
            text_excerpt: "Retention metrics improved",
            score: 0.91,
          },
        ],
      });
      onEvent({ type: "done", chat_id: "chat-1" });
    });

    renderWithAuth();

    fireEvent.change(screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute..."), {
      target: { value: "Summarize traction" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText(/FounderOS response/i)).toBeInTheDocument();
      expect(screen.getByText("Memory Retrieval")).toBeInTheDocument();
      expect(screen.getAllByText("notes.md").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Retention metrics improved").length).toBeGreaterThan(0);
    });

    expect(streamChatQueryMock).toHaveBeenCalledTimes(1);
  });

  it("routes linkedin publish through linkedin endpoint after approval", async () => {
    runContentAgentMock.mockResolvedValueOnce({
      generation_id: "gen-linkedin-1",
      agent_type: "content",
      status: "approval_required",
      approval_required: true,
      query: "write linkedin post",
      format: "linkedin",
      tone: "professional",
      length: "medium",
      title: "LinkedIn Draft",
      draft: "We shipped a major release.",
      context_labels: ["Founder Notes"],
      sources: [
        {
          source_type: "memory",
          source_label: "Founder Notes",
          title: "notes.md",
          snippet: "Release shipped to beta cohort.",
        },
      ],
      created_at: "2026-05-11T12:00:00Z",
    });
    approveGenerationMock.mockResolvedValueOnce({ status: "approved" });
    publishLinkedInMock.mockResolvedValueOnce({
      generation_id: "gen-linkedin-1",
      status: "published",
      channel: "linkedin",
      linkedin_post_urn: "urn:li:share:1",
      linkedin_post_url: "https://linkedin.com/post/1",
      published_at: "2026-05-11T13:00:00Z",
    });

    renderWithAuth();

    selectAgentMode("Content");

    fireEvent.change(screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute..."), {
      target: { value: "write linkedin post" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("We shipped a major release.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Approve/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Approve/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Publish to LinkedIn/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Publish to LinkedIn/i }));

    await waitFor(() => {
      expect(publishLinkedInMock).toHaveBeenCalledWith({ accessToken: "token", generationId: "gen-linkedin-1" });
    });
    expect(publishGenerationMock).not.toHaveBeenCalled();
  });

  it("routes non-linkedin publish through approvals endpoint", async () => {
    runContentAgentMock.mockResolvedValueOnce({
      generation_id: "gen-internal-1",
      agent_type: "content",
      status: "approval_required",
      approval_required: true,
      query: "write founder update",
      format: "founder_update",
      tone: "professional",
      length: "short",
      title: "Founder Update",
      draft: "Weekly internal update.",
      context_labels: ["Product Context"],
      sources: [],
      created_at: "2026-05-11T12:00:00Z",
    });
    approveGenerationMock.mockResolvedValueOnce({ status: "approved" });
    publishGenerationMock.mockResolvedValueOnce({
      generation_id: "gen-internal-1",
      previous_status: "approved",
      status: "published",
      published: true,
      updated_at: "2026-05-11T13:00:00Z",
    });

    renderWithAuth();

    selectAgentMode("Content");
    fireEvent.click(screen.getByLabelText("Content format"));
    fireEvent.click(screen.getByRole("option", { name: "Founder Update" }));

    fireEvent.change(screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute..."), {
      target: { value: "write founder update" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText("Draft Ready")).toBeInTheDocument();
      expect(screen.getAllByText("Founder Update").length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: /Approve/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Approve/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Queue publish/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Queue publish/i }));

    await waitFor(() => {
      expect(publishGenerationMock).toHaveBeenCalledWith({ accessToken: "token", generationId: "gen-internal-1" });
    });
  });

  it("passes blog outline format from composer to content agent", async () => {
    runContentAgentMock.mockResolvedValueOnce({
      generation_id: "gen-blog-1",
      agent_type: "content",
      status: "approval_required",
      approval_required: true,
      query: "generate a blog outline",
      format: "blog_outline",
      tone: "insightful",
      length: "medium",
      title: "Blog Outline",
      draft: "1) Hook\n2) Problem\n3) Solution",
      context_labels: ["Founder Notes"],
      sources: [],
      created_at: "2026-05-11T12:00:00Z",
    });

    renderWithAuth();

    selectAgentMode("Content");
    fireEvent.click(screen.getByLabelText("Content format"));
    fireEvent.click(screen.getByRole("option", { name: "Blog Outline" }));

    fireEvent.change(screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute..."), {
      target: { value: "generate a blog outline" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(runContentAgentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          format: "blog_outline",
        }),
      );
    });
  });

  it("sends generateImage false when the image switch is turned off", async () => {
    runContentAgentMock.mockResolvedValueOnce({
      generation_id: "gen-linkedin-2",
      agent_type: "content",
      status: "approval_required",
      approval_required: true,
      query: "write a linkedin post",
      format: "linkedin",
      tone: "professional",
      length: "medium",
      title: "LinkedIn Draft",
      draft: "Draft",
      context_labels: ["Founder Notes"],
      sources: [],
      created_at: "2026-05-11T12:00:00Z",
    });

    renderWithAuth();

    selectAgentMode("Content");
    const imageSwitch = screen.getByRole("switch", { name: "Generate image" });
    fireEvent.click(imageSwitch);

    fireEvent.change(screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute..."), {
      target: { value: "write a linkedin post" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(runContentAgentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          generateImage: false,
        }),
      );
    });
  });

  it("keeps mock fallback approvals local without backend approval calls", async () => {
    runContentAgentMock.mockRejectedValueOnce(new Error("content service unavailable"));

    renderWithAuth();

    selectAgentMode("Content");

    fireEvent.change(screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute..."), {
      target: { value: "write linkedin post" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getAllByText("FounderOS Launch Narrative").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Approval required/i).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /Approve/i }));

    await waitFor(() => {
      expect(screen.getByText("Approved")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Publish to LinkedIn/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Publish to LinkedIn/i }));

    await waitFor(() => {
      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    expect(approveGenerationMock).not.toHaveBeenCalled();
    expect(rejectGenerationMock).not.toHaveBeenCalled();
    expect(publishLinkedInMock).not.toHaveBeenCalled();
    expect(publishGenerationMock).not.toHaveBeenCalled();
  });

  it("records voice, injects transcript into composer, and keeps normal send flow", async () => {
    streamChatQueryMock.mockResolvedValueOnce(undefined);
    transcribeVoiceMock.mockResolvedValueOnce({
      transcript: "Draft an investor update for this week.",
      provider: "whisper",
      model: "whisper-1",
      language: "en",
    });

    const stopTrack = vi.fn();
    const mediaStream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(mediaStream);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia },
      configurable: true,
    });

    class MockMediaRecorder {
      public state = "inactive";
      public mimeType = "audio/webm";
      public ondataavailable: ((event: BlobEvent) => void) | null = null;
      public onstop: (() => void) | null = null;

      start() {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["audio"], { type: "audio/webm" }) } as BlobEvent);
        this.onstop?.();
      }
    }

    vi.stubGlobal("MediaRecorder", MockMediaRecorder as unknown as typeof MediaRecorder);

    renderWithAuth();

    const voiceButton = screen.getByRole("button", { name: "Record voice" });
    const nowSpy = vi.spyOn(Date, "now");
    let nowValue = 0;
    nowSpy.mockImplementation(() => {
      nowValue += 1_000;
      return nowValue;
    });
    fireEvent.pointerDown(voiceButton);

    await waitFor(() => {
      expect(screen.getByText("Recording... release to transcribe.")).toBeInTheDocument();
    });

    fireEvent.pointerUp(voiceButton);

    await waitFor(() => {
      expect(transcribeVoiceMock).toHaveBeenCalledTimes(1);
    });

    const composer = screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute...") as HTMLTextAreaElement;
    await waitFor(() => {
      expect(composer.value).toContain("Draft an investor update for this week.");
      expect(screen.getByText("Voice Transcript")).toBeInTheDocument();
    });

    expect(streamChatQueryMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(streamChatQueryMock).toHaveBeenCalledTimes(1);
    });

    nowSpy.mockRestore();
  });

  it("uses browser speech recognition first and skips backend transcription", async () => {
    streamChatQueryMock.mockResolvedValueOnce(undefined);

    class MockSpeechRecognition {
      public lang = "";
      public continuous = false;
      public interimResults = false;
      public maxAlternatives = 1;
      public onresult: ((event: any) => void) | null = null;
      public onerror: (() => void) | null = null;
      public onend: (() => void) | null = null;

      start() {}

      stop() {
        this.onresult?.({
          results: [[{ transcript: "Browser transcript path" }]],
        });
        this.onend?.();
      }

      abort() {
        this.onend?.();
      }
    }

    Object.defineProperty(window, "SpeechRecognition", {
      value: MockSpeechRecognition,
      configurable: true,
    });

    renderWithAuth();

    const voiceButton = screen.getByRole("button", { name: "Record voice" });
    const nowSpy = vi.spyOn(Date, "now");
    let nowValue = 0;
    nowSpy.mockImplementation(() => {
      nowValue += 1_000;
      return nowValue;
    });

    fireEvent.pointerDown(voiceButton);
    fireEvent.pointerUp(voiceButton);

    const composer = screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute...") as HTMLTextAreaElement;
    await waitFor(() => {
      expect(composer.value).toContain("Browser transcript path");
      expect(screen.getByText("Voice Transcript")).toBeInTheDocument();
    });

    expect(transcribeVoiceMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(streamChatQueryMock).toHaveBeenCalledTimes(1);
    });

    nowSpy.mockRestore();
  });

  it("shows transcription error and keeps input untouched when voice transcription fails", async () => {
    transcribeVoiceMock.mockRejectedValueOnce(new Error("Whisper unavailable"));

    const stopTrack = vi.fn();
    const mediaStream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(mediaStream);
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia },
      configurable: true,
    });

    class MockMediaRecorder {
      public state = "inactive";
      public mimeType = "audio/webm";
      public ondataavailable: ((event: BlobEvent) => void) | null = null;
      public onstop: (() => void) | null = null;

      start() {
        this.state = "recording";
      }

      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["audio"], { type: "audio/webm" }) } as BlobEvent);
        this.onstop?.();
      }
    }

    vi.stubGlobal("MediaRecorder", MockMediaRecorder as unknown as typeof MediaRecorder);

    renderWithAuth();

    const composer = screen.getByPlaceholderText("Ask FounderOS to research, generate, summarize, or execute...") as HTMLTextAreaElement;
    expect(composer.value).toBe("");

    const voiceButton = screen.getByRole("button", { name: "Record voice" });
    const nowSpy = vi.spyOn(Date, "now");
    let nowValue = 0;
    nowSpy.mockImplementation(() => {
      nowValue += 1_000;
      return nowValue;
    });
    fireEvent.pointerDown(voiceButton);

    await waitFor(() => {
      expect(screen.getByText("Recording... release to transcribe.")).toBeInTheDocument();
    });

    fireEvent.pointerUp(voiceButton);

    await waitFor(() => {
      expect(screen.getByText("Whisper unavailable")).toBeInTheDocument();
    });
    expect(composer.value).toBe("");
    expect(screen.queryByText("Voice Transcript")).not.toBeInTheDocument();

    nowSpy.mockRestore();
  });
});
