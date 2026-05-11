import type { ChatCitation } from "@/lib/chat";
import type { ContentAgentResponse } from "@/lib/content-agent";
import type { ResearchAgentResponse } from "@/lib/research-agent";


export async function simulateAssistantStream({
  text,
  onToken,
}: {
  text: string;
  onToken: (token: string) => void;
}): Promise<void> {
  const tokens = text.split(" ");
  for (const token of tokens) {
    onToken(`${token} `);
    await new Promise((resolve) => setTimeout(resolve, 24));
  }
}

export function mockExecutiveResponse(query: string): { markdown: string; citations: ChatCitation[] } {
  return {
    markdown: `### FounderOS Executive Brief\n\nI synthesized your request: **${query}**.\n\n- Focused on market timing and execution windows\n- Pulled memory-backed positioning from founder notes\n- Proposed immediate actions for the next 7 days\n\n| Priority | Action | Why |
| --- | --- | --- |
| High | Validate launch narrative | Improve outbound clarity |
| Medium | Publish operator update | Keep stakeholders aligned |`,
    citations: [
      {
        source_label: "Founder Notes",
        file_name: "go-to-market-notes.pdf",
        text_excerpt: "Narrative clarity directly affects conversion in founder-led sales.",
        score: 0.92,
      },
    ],
  };
}

export function mockResearchResponse(query: string): ResearchAgentResponse {
  return {
    generation_id: `mock-research-${Date.now()}`,
    agent_type: "research",
    query,
    summary: "AI-native operating workflows are converging on memory + execution + publishing loops.",
    signals: [
      "Faster execution tools are becoming a moat for early-stage teams",
      "Founders prefer integrated operating copilots over fragmented point tools",
      "Narrative speed and consistency are now measurable growth levers",
    ],
    risks: ["Feature overlap with generic copilots", "Execution noise without approval gating"],
    actions: ["Differentiate on approval-aware publishing", "Promote memory-grounded outputs in product messaging"],
    sources: [
      {
        title: "AI Operating Stack Signals",
        url: "https://example.com/ai-operating-stack",
        source_type: "web",
        source_label: "Mock Web",
        snippet: "Teams are consolidating AI workflows into a single operational surface.",
      },
    ],
    created_at: new Date().toISOString(),
  };
}

export function mockContentResponse(query: string): ContentAgentResponse {
  return {
    generation_id: `mock-content-${Date.now()}`,
    agent_type: "content",
    status: "approval_required",
    approval_required: true,
    query,
    format: "linkedin",
    tone: "professional",
    length: "medium",
    title: "FounderOS Launch Narrative",
    image_requested: true,
    image_data_url: "",
    image_error: "",
    draft:
      "We just moved FounderOS from concept to operating layer. Memory-aware research, approval-gated content, and founder-speed execution now live in one workflow. If you’re scaling with a small team, reducing context switching is a growth multiplier.",
    context_labels: ["Founder Notes", "AI Trends"],
    sources: [
      {
        source_type: "memory",
        source_label: "Founder Notes",
        title: "launch-notes.md",
        snippet: "Clear founder narrative increases conversion quality in outbound.",
      },
    ],
    created_at: new Date().toISOString(),
  };
}
