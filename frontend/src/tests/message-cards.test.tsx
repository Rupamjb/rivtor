import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessageCards } from "@/components/chat/message-cards";
import type { DashboardMessage } from "@/types/founderos-dashboard";


describe("message cards markdown rendering", () => {
  it("renders markdown tables in a horizontally scrollable wrapper", () => {
    const messages: DashboardMessage[] = [
      {
        id: "msg-1",
        kind: "assistant",
        createdAt: "2026-05-11T12:00:00Z",
        markdown: "| Priority | Action |\n| --- | --- |\n| High | Fix spacing |",
      },
    ];

    render(
      <MessageCards
        messages={messages}
        onApprove={vi.fn()}
        onReject={vi.fn()}
        onPublish={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(table.parentElement).toHaveClass("overflow-x-auto");
  });
});
