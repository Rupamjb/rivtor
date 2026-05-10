import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DecisionMock } from "./FeatureMocks/DecisionMock";
import { CSuiteMock } from "./FeatureMocks/CSuiteMock";
import { GovernanceMock } from "./FeatureMocks/GovernanceMock";
import { EventLogMock } from "./FeatureMocks/EventLogMock";
import { cn } from "@/lib/utils";

const tabs = [
  {
    n: "01", key: "decision", label: "DECISION ENGINE",
    title: "Nothing runs without a decision",
    body: "Every action carries a decision_id. Options are diverged, simulated across T+1 / T+10 / T+100, critiqued by a Braintrust of independent agents and authorized — then committed to the event log.",
    bullets: [
      "Structurally diverse options, not paraphrases",
      "Pairwise ranking, never scalar scoring",
      "Critique is decoupled from authority",
    ],
    Mock: DecisionMock,
  },
  {
    n: "02", key: "csuite", label: "C-SUITE OF AGENTS",
    title: "A whole company, on call",
    body: "Rivtor 01 routes intent to specialist agents — CTO ships code, CMO runs growth, COO operates, CFO models cash, the Co-Founder owns strategy. They coordinate over the Agent Communication Bus.",
    bullets: [
      "Domain-routed delegation (technical · growth · operations)",
      "Stateless orchestrator, persistent shared state",
      "Lite · Pro · Max tiers tune autonomy per workspace",
    ],
    Mock: CSuiteMock,
  },
  {
    n: "03", key: "gov", label: "GOVERNED RUNTIME",
    title: "Fail-closed, by default",
    body: "Every step passes authority, budget, reversibility and policy checks before it executes. Tiered HITL: Lite approves all, Pro approves on risk, Max runs autonomous — and learns from every override.",
    bullets: [
      "Authority · budget · reversibility · risk gates",
      "Per-step isolated sandboxes with kernel-level policy",
      "Auto-checkpoint and rollback on every commit",
    ],
    Mock: GovernanceMock,
  },
  {
    n: "04", key: "evt", label: "EVENT-SOURCED OS",
    title: "Replayable. Auditable. Reversible.",
    body: "139+ canonical event types. Cryptographic chain. Deterministic replay. Transactional outbox. State is a projection of the log — not a guess. You can rewind to any moment in your company's history.",
    bullets: [
      "SHA-256 chained events with sequence ordering",
      "Snapshot acceleration for sub-second replay",
      "Projections build the live ontology automatically",
    ],
    Mock: EventLogMock,
  },
];

export const FeatureTabs = () => {
  const [active, setActive] = useState(0);
  const tab = tabs[active];
  const Mock = tab.Mock;

  return (
    <section className="relative bg-rv py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="label-eyebrow mb-6 inline-flex items-center gap-2 text-rv-text">
          <span className="h-2 w-2 bg-rv-violet" />
          WHY RIVTOR
        </div>
        <h2 className="font-display mb-12 max-w-[1000px] text-[clamp(1.6rem,7vw,3.75rem)] font-medium leading-[1.06] tracking-[-0.03em] text-rv-text sm:mb-16 lg:mb-24">
          You hired an autonomous company.
          <br />
          Give it an operating system.
        </h2>

        <div className="grid grid-cols-1 gap-px bg-white/[0.06] hairline lg:grid-cols-[260px_minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="flex flex-col bg-rv">
            {tabs.map((t, i) => (
              <button
                key={t.key}
                onClick={() => setActive(i)}
                className={cn(
                  "flex items-center gap-4 border-l-2 px-4 py-4 text-left transition-colors sm:px-6 sm:py-6",
                  active === i
                    ? "border-rv-violet bg-rv-violet/5"
                    : "border-transparent hover:bg-white/[0.02]"
                )}
              >
                <span
                  className={cn(
                    "label-eyebrow flex h-6 w-6 items-center justify-center text-[10px]",
                    active === i ? "bg-rv-violet text-white" : "hairline text-rv-dim"
                  )}
                >
                  {t.n}
                </span>
                <span className={cn(
                  "label-eyebrow",
                  active === i ? "text-rv-text" : "text-rv-dim"
                )}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          <div className="relative hidden min-h-[460px] overflow-hidden bg-black md:block lg:min-h-[520px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <Mock />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="bg-rv p-6 sm:p-8 lg:p-10">
            <div className="label-eyebrow mb-6 text-rv-dim">{tab.n}</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="font-display mb-4 text-[24px] font-semibold leading-[1.15] text-rv-text sm:text-[28px]">
                  {tab.title}
                </h3>
                <p className="mb-6 text-[14px] leading-relaxed text-rv-dim sm:mb-8">
                  {tab.body}
                </p>
                <ul className="space-y-4">
                  {tab.bullets.map((b, idx) => (
                    <li key={b} className={cn("flex gap-3 text-[13px] text-rv-text/85", idx > 1 && "hidden sm:flex")}>
                      <span className="mt-[7px] h-px w-3 shrink-0 bg-rv-violet" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
