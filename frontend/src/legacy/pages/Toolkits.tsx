import { PageFrame } from "@/components/rivtor/PageFrame";

const toolkits = [
  ["Rivtor CLI", "Operate directives, inspect decisions, and replay outcomes from terminal-first workflows."],
  ["MCP Server", "Connect Rivtor intelligence to your existing developer and operations surfaces."],
  ["API + Webhooks", "Drive external systems with deterministic event payloads and receipt signatures."],
  ["Runbooks", "Prebuilt autonomous templates for launch, incident response, and growth loops."],
];

const Toolkits = () => {
  return (
    <PageFrame
      eyebrow="TOOLKITS"
      title="Interfaces built for operators"
      description="Use the control surface that matches your team: terminal, API, or connected workflow systems."
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {toolkits.map(([title, body]) => (
          <article key={title} className="hairline bg-rv-2 p-6 sm:p-8">
            <h2 className="font-display text-[22px] leading-[1.12] tracking-[-0.02em] sm:text-[26px]">{title}</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-rv-dim">{body}</p>
          </article>
        ))}
      </div>
    </PageFrame>
  );
};

export default Toolkits;
