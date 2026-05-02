export const GovernanceMock = () => (
  <div className="relative h-full w-full overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_50%_30%,rgba(124,92,255,0.16),transparent_60%)]" />
    <div className="relative flex h-full items-center justify-center p-10">
      <div className="hairline w-[480px] bg-black/75 p-5 backdrop-blur">
        <div className="mb-4 flex items-center justify-between">
          <div className="label-eyebrow text-rv-dim">POLICY_GATE</div>
          <span className="label-eyebrow border border-rv-violet/40 px-2 py-0.5 text-[9px] text-rv-violet">
            TIER · PRO
          </span>
        </div>

        <div className="space-y-1.5 font-mono text-[11px]">
          {[
            ["AUTHORITY", "CTO scope OK", "ok"],
            ["BUDGET", "$1,240 / $5,000", "ok"],
            ["REVERSIBILITY", "rollback ≤ 90s", "ok"],
            ["RISK", "policy 0028 · approval needed", "wait"],
          ].map(([k, v, s]) => (
            <div key={k} className="hairline flex items-center justify-between bg-black/40 px-3 py-2.5">
              <span className="text-rv-dim">{k}</span>
              <span className="text-rv-text/85">{v}</span>
              <span className={s === "ok" ? "text-rv-cyan" : "text-amber-400"}>
                {s === "ok" ? "✓" : "!"}
              </span>
            </div>
          ))}
        </div>

        <div className="hairline mt-4 bg-rv-violet/10 p-3">
          <div className="label-eyebrow mb-2 text-rv-violet">HUMAN-IN-THE-LOOP</div>
          <div className="font-mono text-[11px] text-rv-text/90">
            Approve "deploy pricing-v2 to 50% of traffic"
          </div>
          <div className="mt-3 flex gap-2">
            <button className="label-eyebrow bg-rv-violet px-3 py-1.5 text-[10px] text-white">APPROVE</button>
            <button className="label-eyebrow hairline px-3 py-1.5 text-[10px] text-rv-dim">DEFER</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
