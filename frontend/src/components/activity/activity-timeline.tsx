import { motion } from "framer-motion";
import { Activity, CheckCircle2, FileText, Globe2, UploadCloud } from "lucide-react";

import type { ActivityFeedItem } from "@/lib/activities-feed";


function activityIcon(type: string) {
  if (type === "document_uploaded") {
    return UploadCloud;
  }
  if (type === "research_completed") {
    return Globe2;
  }
  if (type === "content_draft_created") {
    return FileText;
  }
  if (type === "content_published") {
    return CheckCircle2;
  }
  return Activity;
}

function activityLabel(type: string) {
  if (type === "document_uploaded") {
    return "Notes uploaded";
  }
  if (type === "research_completed") {
    return "Research completed";
  }
  if (type === "content_draft_created") {
    return "Post generated";
  }
  if (type === "approval_approved") {
    return "Approval granted";
  }
  if (type === "approval_rejected") {
    return "Approval rejected";
  }
  if (type === "content_published") {
    return "LinkedIn published";
  }
  return type.replace(/_/g, " ");
}

function relativeTime(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) {
    return "now";
  }
  const diffMinutes = Math.max(0, Math.round((now - then) / 60_000));
  if (diffMinutes < 1) {
    return "now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  return `${Math.round(hours / 24)}d ago`;
}

export function ActivityTimeline({ items }: { items: ActivityFeedItem[] }) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-zinc-400">No activity yet.</p>;
  }

  return (
    <div className="space-y-2">
      {items.slice(0, 8).map((item) => {
        const Icon = activityIcon(item.event_type);
        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-xs text-zinc-200/90">
                <Icon className="h-3.5 w-3.5 text-zinc-400" />
                {activityLabel(item.event_type)}
              </span>
              <span className="text-[11px] text-zinc-500">{relativeTime(item.created_at)}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
