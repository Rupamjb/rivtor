import { PageFrame } from "@/components/rivtor/PageFrame";

const sections = [
  {
    heading: "Quickstart",
    text: "Connect your workspace, define authority scopes, and run your first directive in under 10 minutes.",
  },
  {
    heading: "Decision Engine",
    text: "Understand divergence, simulation windows, pairwise ranking, and final authorization semantics.",
  },
  {
    heading: "Governance",
    text: "Configure budget policy, risk levels, reversibility constraints, and tiered HITL approvals.",
  },
  {
    heading: "Event Log + Replay",
    text: "Use deterministic replay and snapshots to inspect history, recover state, and audit outcomes.",
  },
];

const Docs = () => {
  return (
    <PageFrame
      eyebrow="DOCS"
      title="Everything needed to operate Rivtor"
      description="Reference guides and implementation docs for integrating Rivtor into production workflows."
    >
      <div className="grid grid-cols-1 gap-px bg-white/[0.06] hairline lg:grid-cols-2">
        {sections.map((section) => (
          <article key={section.heading} className="bg-rv px-6 py-6 sm:px-8 sm:py-8">
            <h2 className="font-display text-[22px] tracking-[-0.02em] sm:text-[26px]">{section.heading}</h2>
            <p className="mt-4 text-[14px] leading-relaxed text-rv-dim">{section.text}</p>
          </article>
        ))}
      </div>
    </PageFrame>
  );
};

export default Docs;
