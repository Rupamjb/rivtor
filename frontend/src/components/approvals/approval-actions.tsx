import { motion } from "framer-motion";
import { Check, Save, SendHorizonal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WorkflowDraftStatus } from "@/types/founderos-dashboard";


function statusLabel(status: WorkflowDraftStatus): string {
  if (status === "approval_required") {
    return "Approval required";
  }
  if (status === "approved") {
    return "Approved";
  }
  if (status === "rejected") {
    return "Rejected";
  }
  if (status === "published") {
    return "Published";
  }
  return "Saved draft";
}

export function ApprovalActions({
  status,
  busy,
  channel,
  error,
  onApprove,
  onReject,
  onPublish,
  onSave,
}: {
  status: WorkflowDraftStatus;
  busy: boolean;
  channel: "linkedin" | "internal";
  error: string;
  onApprove: () => void;
  onReject: () => void;
  onPublish: () => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-300/80">
        {statusLabel(status)}
      </div>

      <motion.div layout className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy || status === "published"} onClick={onApprove}>
          <Check className="mr-1 h-3.5 w-3.5" /> Approve
        </Button>
        <Button size="sm" variant="outline" disabled={busy || status === "published"} onClick={onReject}>
          <X className="mr-1 h-3.5 w-3.5" /> Reject
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-white/[0.02]"
          disabled={busy || status !== "approved"}
          onClick={onPublish}
        >
          <SendHorizonal className="mr-1 h-3.5 w-3.5" /> {channel === "linkedin" ? "Publish to LinkedIn" : "Queue publish"}
        </Button>
        <Button size="sm" variant="outline" className="bg-white/[0.02]" disabled={busy} onClick={onSave}>
          <Save className="mr-1 h-3.5 w-3.5" /> Save draft
        </Button>
      </motion.div>

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
