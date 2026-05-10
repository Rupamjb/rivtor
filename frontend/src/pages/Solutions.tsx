import { PageFrame } from "@/components/rivtor/PageFrame";

const solutions = [
  {
    title: "Founder Mode",
    body: "From one-line directives to approved execution plans with full decision traceability.",
  },
  {
    title: "Growth Operations",
    body: "Launch campaigns, run experiments, and optimize funnels with policy-aware autonomy.",
  },
  {
    title: "Product Delivery",
    body: "Translate product goals into execution DAGs with milestone-level status and rollback safety.",
  },
  {
    title: "Finance + Risk",
    body: "Model spend, enforce budget gates, and surface approvals before irreversible actions.",
  },
];

const Solutions = () => {
  return (
    <PageFrame
      eyebrow="SOLUTIONS"
      title="Autonomy tuned by business context"
      description="Deploy Rivtor with the right balance of speed, control, and oversight for each function of your company."
    >
      <div className="grid grid-cols-1 gap-px bg-white/[0.06] hairline md:grid-cols-2">
        {solutions.map((item, i) => (
          <article key={item.title} className="bg-rv p-6 sm:p-8 lg:p-10">
            <div className="label-eyebrow mb-5 text-rv-dim">0{i + 1}</div>
            <h2 className="font-display text-[24px] leading-[1.12] tracking-[-0.02em] sm:text-[28px]">{item.title}</h2>
            <p className="mt-5 max-w-[520px] text-[14px] leading-relaxed text-rv-dim">{item.body}</p>
          </article>
        ))}
      </div>
    </PageFrame>
  );
};

export default Solutions;
