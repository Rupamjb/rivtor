export const DecisionMock = () => (
  <div className="relative h-full w-full overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(700px_400px_at_30%_30%,rgba(124,92,255,0.18),transparent_60%)]" />
    <div className="relative flex h-full items-center justify-center p-5 sm:p-8 lg:p-10">
      <div className="w-full max-w-[540px] space-y-3">
        <div className="hairline bg-black/70 p-4 backdrop-blur">
          <div className="label-eyebrow mb-3 flex items-center justify-between text-rv-dim">
            <span>DIVERGENCE</span>
            <span className="text-rv-violet">3 OPTIONS</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { k: "A", t: "ship behind feature flag", w: false },
              { k: "B", t: "staged 10/50/100 rollout", w: true },
              { k: "C", t: "full canary on prod", w: false },
            ].map((o) => (
              <div
                key={o.k}
                className={`hairline p-3 ${o.w ? "border-rv-violet/70 bg-rv-violet/10" : "bg-black/40"}`}
              >
                <div className="font-mono text-[11px] text-rv-dim">OPT {o.k}</div>
                <div className="mt-1 font-mono text-[11px] leading-snug text-rv-text">{o.t}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="hairline bg-black/70 p-4 backdrop-blur">
          <div className="label-eyebrow mb-3 text-rv-dim">SIMULATION · EXPECTED FREE ENERGY</div>
          <div className="space-y-2 font-mono text-[11px]">
            {[
              ["T+1h", "+0.4% conv · 0 incidents", "60%"],
              ["T+24h", "+12.4% conv · low risk", "92%"],
              ["T+30d", "compounding +6% MRR", "78%"],
            ].map(([t, v, w]) => (
              <div key={t} className="flex items-center gap-3">
                <span className="w-12 text-rv-dim">{t}</span>
                <span className="flex-1 text-rv-text/85">{v}</span>
                <div className="h-1 w-20 bg-white/10">
                  <div className="h-full bg-rv-violet" style={{ width: w }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hairline flex items-center justify-between bg-black/70 px-4 py-3 backdrop-blur font-mono text-[11px]">
          <span className="text-rv-dim">DECISION_ID</span>
          <span className="text-rv-text">a1f4e7c2-9b…</span>
          <span className="label-eyebrow bg-rv-violet/20 px-2 py-0.5 text-[9px] text-rv-violet">COMMITTED</span>
        </div>
      </div>
    </div>
  </div>
);
