const agents = [
  { role: "RIVTOR 01", name: "Orchestrator", status: "ROUTING", tone: "violet" },
  { role: "CTO", name: "Engineering", status: "EXECUTING", tone: "cyan" },
  { role: "CMO", name: "Growth", status: "PLANNING", tone: "violet" },
  { role: "COO", name: "Operations", status: "IDLE", tone: "dim" },
  { role: "CFO", name: "Finance", status: "MODELING", tone: "violet" },
  { role: "CO-FOUNDER", name: "Strategy", status: "IDLE", tone: "dim" },
];

const bus = [
  "tasks_technical · ship pricing-v2",
  "tasks_growth · launch waitlist email",
  "tasks_operations · reconcile MRR",
  "tasks_technical · patch sentry P0",
];

export const CSuiteMock = () => (
  <div className="relative h-full w-full overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_70%_50%,rgba(0,212,255,0.10),transparent_60%)]" />
    <div className="relative grid h-full grid-cols-[1.1fr_1fr] gap-3 p-10">
      <div className="hairline bg-black/70 p-4 backdrop-blur">
        <div className="label-eyebrow mb-3 text-rv-dim">C-SUITE</div>
        <div className="space-y-2">
          {agents.map((a) => (
            <div key={a.role} className="hairline flex items-center gap-3 bg-black/40 p-2.5">
              <div className="flex h-7 w-7 items-center justify-center bg-rv-violet/15 font-mono text-[10px] text-rv-violet">
                {a.role.split(" ")[0].slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[11px] text-rv-text">{a.role}</div>
                <div className="font-mono text-[10px] text-rv-dim">{a.name}</div>
              </div>
              <span
                className={`label-eyebrow text-[9px] ${
                  a.tone === "cyan" ? "text-rv-cyan" : a.tone === "violet" ? "text-rv-violet" : "text-rv-dim"
                }`}
              >
                ● {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="hairline bg-black/70 p-4 backdrop-blur">
        <div className="label-eyebrow mb-3 flex items-center justify-between text-rv-dim">
          <span>AGENT_COMM_BUS</span>
          <span className="text-rv-cyan">LIVE</span>
        </div>
        <div className="space-y-2 font-mono text-[10px]">
          {bus.map((b, i) => (
            <div key={b} className="hairline flex items-center gap-2 bg-black/40 px-2.5 py-2">
              <span className="text-rv-violet">›</span>
              <span className="flex-1 text-rv-text/85">{b}</span>
              <span className="text-rv-dim">#{231 + i}</span>
            </div>
          ))}
        </div>
        <div className="hairline-t mt-4 pt-3 font-mono text-[10px] text-rv-dim">
          throughput · 184 msg/min · p95 28ms
        </div>
      </div>
    </div>
  </div>
);
