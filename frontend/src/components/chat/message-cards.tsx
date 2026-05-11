import { motion } from "framer-motion";
import { useState } from "react";
import { ExternalLink, Globe, MemoryStick } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ApprovalActions } from "@/components/approvals/approval-actions";
import { TypingIndicator } from "@/components/shared/typing-indicator";
import type { DashboardMessage } from "@/types/founderos-dashboard";


function MessageShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="rounded-2xl border border-white/10 bg-[#10131b] px-4 py-3"
    >
      {children}
    </motion.article>
  );
}

export function MessageCards({
  messages,
  onApprove,
  onReject,
  onPublish,
  onSave,
}: {
  messages: DashboardMessage[];
  onApprove: (generationId: string) => void;
  onReject: (generationId: string) => void;
  onPublish: (generationId: string, channel: "linkedin" | "internal") => void;
  onSave: (generationId: string) => void;
}) {
  const [expandedCitation, setExpandedCitation] = useState<string>("");

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        if (message.kind === "user") {
          return (
            <div key={message.id} className="flex justify-end">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[82%] rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-zinc-100"
              >
                {message.text}
              </motion.div>
            </div>
          );
        }

        if (message.kind === "assistant") {
          return (
            <MessageShell key={message.id}>
              <div className="prose prose-invert prose-zinc prose-p:whitespace-pre-wrap prose-li:whitespace-pre-wrap prose-pre:overflow-x-auto max-w-none text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    table: ({ children }) => (
                      <div className="my-3 w-full overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-xs md:text-sm">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-white/10 bg-white/[0.04] px-3 py-2 align-top font-semibold text-zinc-100">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-white/10 px-3 py-2 align-top text-zinc-300">{children}</td>
                    ),
                  }}
                >
                  {message.markdown}
                </ReactMarkdown>
              </div>
              {message.streaming ? (
                <div className="mt-3">
                  <TypingIndicator />
                </div>
              ) : null}

              {message.citations && message.citations.length > 0 ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Why this response</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {message.citations.map((citation, index) => {
                      const key = `${message.id}-${index}`;
                      const active = expandedCitation === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setExpandedCitation(active ? "" : key)}
                          className={`rounded-full border px-2 py-1 text-[10px] ${
                            active
                              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                              : "border-white/10 bg-white/[0.03] text-zinc-300"
                          }`}
                        >
                          {citation.source_label}
                        </button>
                      );
                    })}
                  </div>

                  {message.citations.map((citation, index) => {
                    const key = `${message.id}-${index}`;
                    if (expandedCitation !== key) {
                      return null;
                    }
                    return (
                      <div key={`${key}-detail`} className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-2 text-xs text-zinc-300">
                        <p className="text-zinc-100">{citation.file_name}</p>
                        <p className="mt-1 line-clamp-4 text-zinc-400">{citation.text_excerpt || "Memory snippet unavailable."}</p>
                        <p className="mt-1 text-[10px] text-zinc-500">Confidence: {Math.round((citation.score ?? 0.75) * 100)}%</p>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </MessageShell>
          );
        }

        if (message.kind === "research") {
          return (
            <MessageShell key={message.id}>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-zinc-400">
                <Globe className="h-3.5 w-3.5" /> Research Result
              </div>
              <p className="mt-2 text-sm text-zinc-100">{message.research.summary}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Signals</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-300">
                    {message.research.signals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-500">Actions</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-300">
                    {message.research.actions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {message.research.sources.map((source) => (
                  <a
                    key={`${source.title}-${source.url}`}
                    href={source.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-zinc-300 transition hover:bg-white/[0.04]"
                  >
                    <div className="inline-flex items-center gap-1 text-zinc-200">
                      {source.title}
                      <ExternalLink className="h-3 w-3" />
                    </div>
                    <p className="mt-1 line-clamp-2 text-zinc-400">{source.snippet}</p>
                  </a>
                ))}
              </div>
            </MessageShell>
          );
        }

        if (message.kind === "linkedin_post") {
          const versionNumber = Math.max(1, messages.filter((item) => item.kind === "linkedin_post").findIndex((item) => item.id === message.id) + 1);
          return (
            <MessageShell key={message.id}>
              <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">LinkedIn Post</p>
              <p className="mt-2 text-sm text-zinc-100">{message.content.title}</p>
              {message.content.image_data_url ? (
                <img
                  src={message.content.image_data_url}
                  alt="AI generated post visual"
                  className="mt-3 aspect-square w-full max-w-sm rounded-xl border border-white/10 object-cover"
                />
              ) : null}
              {message.content.image_requested && !message.content.image_data_url && message.content.image_error ? (
                <p className="mt-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
                  Image generation skipped: {message.content.image_error}
                </p>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{message.content.draft}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {message.content.context_labels.map((label) => (
                  <span key={label} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-300">
                    {label}
                  </span>
                ))}
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-300">
                  Version {versionNumber}
                </span>
              </div>

              <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-2 text-xs text-zinc-300">
                <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400">Content Versioning</p>
                <div className="mt-1 space-y-1">
                  <p>- Version {versionNumber} Draft</p>
                  <p>- Status: {message.status === "published" ? "Published Version" : message.status.replace(/_/g, " ")}</p>
                </div>
              </div>

              {message.linkedinPostUrl ? (
                <a href={message.linkedinPostUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-300 underline">
                  View Published Post <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}

              {message.error ? <p className="mt-2 text-xs text-rose-300">{message.error}</p> : null}
            </MessageShell>
          );
        }

        if (message.kind === "approval") {
          return (
            <MessageShell key={message.id}>
              <p className="text-xs uppercase tracking-[0.08em] text-zinc-400">Approval Workflow</p>
              <div className="mt-3">
                <ApprovalActions
                  status={message.status}
                  busy={message.busy}
                  channel={message.channel}
                  error={message.error}
                  onApprove={() => onApprove(message.generationId)}
                  onReject={() => onReject(message.generationId)}
                  onPublish={() => onPublish(message.generationId, message.channel)}
                  onSave={() => onSave(message.generationId)}
                />
              </div>
            </MessageShell>
          );
        }

        return (
          <MessageShell key={message.id}>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-zinc-400">
              <MemoryStick className="h-3.5 w-3.5" /> Memory Retrieval
            </div>
            <div className="mt-2 space-y-2">
              {message.items.map((item, index) => (
                <div key={`${item.file_name}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
                  <p className="text-xs text-zinc-200">{item.file_name}</p>
                  <p className="mt-1 line-clamp-3 text-xs text-zinc-400">{item.text}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{item.source_label}</span>
                    <span>{Math.round((item.score ?? 0.75) * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </MessageShell>
        );
      })}
    </div>
  );
}
