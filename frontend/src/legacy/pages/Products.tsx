import { PageFrame } from "@/components/rivtor/PageFrame";

const products = [
  {
    name: "Rivtor 01",
    desc: "Routes founder intent into precise execution plans with decision-backed accountability.",
    points: ["Decision graph generation", "Cross-agent delegation", "Outcome receipts"],
  },
  {
    name: "C-Suite Agents",
    desc: "Specialist agents for product, growth, operations, and finance operating on a shared context fabric.",
    points: ["CTO, CMO, COO, CFO, Co-Founder", "Topic-based communication bus", "Role-level governance"],
  },
  {
    name: "Governed Runtime",
    desc: "Fail-closed execution with authority, budget, reversibility, and policy checks on every action.",
    points: ["Tiered HITL controls", "Sandboxed execution", "Automatic rollback checkpoints"],
  },
];

const Products = () => {
  return (
    <PageFrame
      eyebrow="PRODUCTS"
      title="A complete autonomous company stack"
      description="Rivtor ships as one integrated operating system: decision engine, specialist agents, governance controls, and event-sourced memory."
    >
      <div className="grid grid-cols-1 gap-px bg-white/[0.06] hairline lg:grid-cols-3">
        {products.map((p) => (
          <article key={p.name} className="bg-rv p-6 sm:p-8 lg:p-10">
            <h2 className="font-display text-[25px] leading-[1.1] tracking-[-0.02em] sm:text-[30px]">{p.name}</h2>
            <p className="mt-5 text-[14px] leading-relaxed text-rv-dim">{p.desc}</p>
            <ul className="mt-8 space-y-3">
              {p.points.map((point) => (
                <li key={point} className="flex gap-3 text-[13px] text-rv-text/90">
                  <span className="mt-[7px] h-px w-3 shrink-0 bg-rv-violet" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </PageFrame>
  );
};

export default Products;
