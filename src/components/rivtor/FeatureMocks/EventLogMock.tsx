const events = [
  { seq: 231, type: "AGENT_DECISION_MADE", entity: "decision/a1f4e7c2", actor: "rivtor_01" },
  { seq: 232, type: "POLICY_VALIDATED", entity: "policy/0028", actor: "governance" },
  { seq: 233, type: "TASK_STARTED", entity: "task/deploy-pricing-v2", actor: "cto" },
  { seq: 234, type: "COMMAND_EXECUTED", entity: "sandbox/4f7a", actor: "cto" },
  { seq: 235, type: "BUILD_COMPLETED", entity: "artifact/pricing-v2", actor: "cto" },
  { seq: 236, type: "STATE_PROJECTED", entity: "ontology/product", actor: "projection_worker" },
];

export const EventLogMock = () => (
  <div className="relative h-full w-full overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(700px_500px_at_50%_50%,rgba(0,212,255,0.10),transparent_60%)]" />
    <div className="relative flex h-full items-center justify-center p-10">
      <div className="hairline w-[560px] bg-black/80 p-5 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div className="label-eyebrow text-rv-dim">EVENT_LOG · project_acme</div>
          <span className="font-mono text-[10px] text-rv-cyan">● APPENDING</span>
        </div>
        <div className="space-y-1 font-mono text-[10px]">
          <div className="grid grid-cols-[40px_1fr_140px_70px] gap-2 px-2 pb-1 text-rv-dim">
            <span>SEQ</span>
            <span>EVENT_TYPE</span>
            <span>ENTITY</span>
            <span>ACTOR</span>
          </div>
          {events.map((e, i) => (
            <div
              key={e.seq}
              className="hairline grid grid-cols-[40px_1fr_140px_70px] items-center gap-2 bg-black/40 px-2 py-2"
            >
              <span className="text-rv-dim">{e.seq}</span>
              <span className="text-rv-text">{e.type}</span>
              <span className="truncate text-rv-text/70">{e.entity}</span>
              <span className={i === events.length - 1 ? "text-rv-cyan" : "text-rv-dim"}>{e.actor}</span>
            </div>
          ))}
        </div>
        <div className="hairline-t mt-4 grid grid-cols-2 gap-2 pt-3 font-mono text-[10px]">
          <div>
            <div className="label-eyebrow mb-1 text-rv-dim">CHAIN</div>
            <div className="text-rv-text/80">prev 9c4…2a · hash 7f1…0e</div>
          </div>
          <div>
            <div className="label-eyebrow mb-1 text-rv-dim">REPLAY</div>
            <div className="text-rv-text/80">deterministic · snapshot @ 230</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
