import { Slack, Stripe, Linear, Notion, Vercel, Github, Sentry } from "./BrandMarks";

const directives = [
  { Mark: Slack, name: "Slack", task: "Triage P0 incident in #prod-alerts", status: "ROUTED → CTO", tone: "violet" },
  { Mark: Stripe, name: "Stripe", task: "Reconcile MRR · close Q3 books", status: "DONE · 14m ago", tone: "ok" },
  { Mark: Linear, name: "Linear", task: "Spin up Q4 product roadmap", status: "DECISION_ID a1f4…", tone: "violet" },
  { Mark: Notion, name: "Notion", task: "Publish launch memo + brief board", status: "APPROVED · TIER PRO", tone: "violet" },
  { Mark: Vercel, name: "Vercel", task: "Deploy pricing-v2 to 50% traffic", status: "BUILDING", tone: "cyan" },
  { Mark: Sentry, name: "Sentry", task: "Auto-fix recurring 500s on /api/checkout", status: "PATCH MERGED", tone: "ok" },
];

const toneClass = (t: string) =>
  t === "ok" ? "text-emerald-600" : t === "cyan" ? "text-cyan-600" : "text-[#5B3DF5]";

const chainEntries = [
  { seq: "234", type: "TASK_STARTED", prev: "9c4…2a", hash: "7f1…0e" },
  { seq: "235", type: "BUILD_COMPLETED", prev: "7f1…0e", hash: "b32…d9" },
  { seq: "236", type: "STATE_PROJECTED", prev: "b32…d9", hash: "0e8…41" },
];

export const LightSection = () => {
  return (
    <section id="light-section" className="relative bg-white py-20 text-[#050507] sm:py-24 lg:py-32">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="label-eyebrow mb-6 inline-flex items-center gap-2 text-[#050507]">
          <span className="h-2 w-2 bg-[#5B3DF5]" />
          FROM ONE-LINE BRIEF TO SHIPPED COMPANY
        </div>
        <h2 className="font-display mb-12 max-w-[920px] text-[clamp(1.55rem,7vw,3.75rem)] font-semibold leading-[1.06] tracking-[-0.02em] sm:mb-16 lg:mb-20">
          Tell Rivtor what to ship.
          <br className="hidden sm:block" />
          It runs the rest.
        </h2>

        <div className="grid grid-cols-1 gap-10 border-y border-black/10 py-10 sm:py-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)_minmax(0,1.05fr)] lg:py-16">
          {/* Left — copy */}
          <div>
            <div className="mb-6 flex items-center gap-2">
              <span className="font-display text-[20px] font-semibold">Rivtor</span>
              <span className="label-eyebrow border border-[#5B3DF5]/40 px-2 py-0.5 text-[10px] text-[#5B3DF5]">
                FOR FOUNDERS
              </span>
            </div>
            <p className="mb-8 max-w-[380px] text-[14px] leading-relaxed text-black/70">
              A C-suite of agents with a governed runtime — not a chatbot,
              not a workflow builder. Brief it once, and Rivtor decides,
              executes and ships across your whole stack.
            </p>
            <ul className="mb-10 space-y-4 max-w-[380px]">
              {[
                ["Decision-driven", "Nothing executes without a decision_id"],
                ["Event-sourced", "Replayable, auditable, reversible state"],
                ["Governance-first", "Authority, budget and risk gates by default"],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-3 text-[13px]">
                  <span className="mt-[7px] h-px w-3 shrink-0 bg-[#5B3DF5]" />
                  <div>
                    <div className="font-medium text-[#050507]">{t}</div>
                    <div className="text-black/60">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
            <button className="label-eyebrow bg-[#050507] px-6 py-3 text-white">
              REQUEST ACCESS
            </button>
          </div>

          {/* Center — directive board */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="label-eyebrow text-black/50">DIRECTIVE BOARD · LIVE</div>
              <div className="font-mono text-[11px] text-black/40">project_acme</div>
            </div>
            <div className="border border-black/10">
              {directives.map((d, i) => {
                const Mark = d.Mark;
                return (
                  <div
                    key={d.task}
                    className={`grid grid-cols-[36px_1fr] items-center gap-4 px-3 py-3 sm:grid-cols-[36px_1fr_auto] sm:px-4 sm:py-4 ${
                      i < directives.length - 1 ? "border-b border-black/10" : ""
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center border border-black/10 text-black/80">
                      <Mark size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-black/45">
                        {d.name}
                      </div>
                      <div className="truncate text-[13px] text-[#050507]">{d.task}</div>
                      <span className={`label-eyebrow mt-1 inline-block text-[10px] sm:hidden ${toneClass(d.tone)}`}>
                        {d.status}
                      </span>
                    </div>
                    <span className={`label-eyebrow hidden text-[10px] sm:inline ${toneClass(d.tone)}`}>
                      {d.status}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-black/45">
              <span>● appending events</span>
              <span className="hidden sm:inline">seq #236 · throughput 184/min</span>
            </div>
          </div>

          {/* Right — terminal */}
          <div className="hairline hidden overflow-hidden bg-[#050507] lg:block">
            <div className="flex items-center gap-2 border-b border-white/10 bg-[#0B0F1A] px-3 py-2">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="ml-2 font-mono text-[11px] text-white/60">
                rivtor 01 — event_log — project_acme
              </span>
            </div>
            <div className="px-5 py-6 font-mono text-[11px]">
              <div className="mb-4 flex items-center gap-2 text-white/60">
                <Github size={14} />
                <span>$ rivtor brief "ship pricing-v2 by friday"</span>
              </div>
              <div className="mb-4 text-rv-violet">
                ↳ DECISION_ID a1f4e7c2-9b1a · ROUTED → CTO · TIER PRO
              </div>
              <div className="mb-2 grid grid-cols-[44px_1fr_70px_70px] gap-2 text-white/40">
                <span>seq</span><span>event</span><span>prev</span><span>hash</span>
              </div>
              <div className="space-y-1.5">
                {chainEntries.map((e) => (
                  <div
                    key={e.seq}
                    className="grid grid-cols-[44px_1fr_70px_70px] gap-2 border-l-2 border-rv-violet/60 bg-white/[0.03] px-2 py-1.5"
                  >
                    <span className="text-white/50">{e.seq}</span>
                    <span className="truncate text-white">{e.type}</span>
                    <span className="text-white/40">{e.prev}</span>
                    <span className="text-rv-cyan">{e.hash}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-white/40">
                <span>chain verified · sha-256</span>
                <span>● appending</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
