import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import type { ActiveAgentStage } from "@/types/founderos-dashboard";


const stageTone: Record<ActiveAgentStage, string> = {
  idle: "text-zinc-300/80",
  retrieving_memory: "text-cyan-300",
  researching_web: "text-emerald-300",
  generating_response: "text-indigo-300",
  preparing_output: "text-amber-300",
};

export function ActiveAgentPill({ stage, label }: { stage: ActiveAgentStage; label: string }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0.6, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs"
    >
      <motion.span
        animate={stage === "idle" ? { scale: 1 } : { scale: [1, 1.15, 1] }}
        transition={{ duration: 1.2, repeat: stage === "idle" ? 0 : Infinity }}
      >
        <Sparkles className={`h-3.5 w-3.5 ${stageTone[stage]}`} />
      </motion.span>
      <span className="text-zinc-300/90">{label}</span>
    </motion.div>
  );
}
