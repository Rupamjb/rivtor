import { Github, Linkedin, Youtube } from "lucide-react";

const cols = [
  {
    title: "PRODUCT",
    items: [
      { label: "Rivtor 01", badge: "BETA" },
      "C-Suite of Agents",
      "Sandbox Runtime",
      "Pricing",
      "Changelog",
    ],
  },
  {
    title: "PLATFORM",
    items: ["Decision Engine", "Event Log", "Ontology Graph", "Governance", "Taste Pipeline", "Learning Loop"],
  },
  {
    title: "DEVELOPERS",
    items: ["Docs", "MCP Server", "CLI", "API Reference", "System Architecture", "Status"],
  },
  {
    title: "COMPANY",
    items: ["About", "Careers", "Trust & Security", "Contact", "Terms", "Privacy"],
  },
];

export const Footer = () => {
  return (
    <footer className="bg-rv pb-12 pt-24 hairline-t">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid grid-cols-2 gap-y-12 lg:grid-cols-5 lg:gap-x-8">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 font-display text-[20px] font-semibold tracking-tight text-rv-text">
              <span className="inline-block h-3 w-3 rotate-45 bg-rv-violet" />
              Rivtor
            </div>
            <p className="mt-4 max-w-[220px] text-[12px] leading-relaxed text-rv-dim">
              An autonomous software company in a box.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="label-eyebrow mb-5 text-rv-dim">{c.title}</div>
              <ul className="space-y-3">
                {c.items.map((it: any) => {
                  const label = typeof it === "string" ? it : it.label;
                  const badge = typeof it === "string" ? null : it.badge;
                  return (
                    <li key={label} className="flex items-center gap-2">
                      <a className="label-eyebrow text-rv-text/85 hover:text-rv-text">{label}</a>
                      {badge && (
                        <span className="label-eyebrow border border-rv-violet/40 px-1.5 py-0.5 text-[9px] text-rv-violet">
                          {badge}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 flex items-center justify-between hairline-t pt-6">
          <div className="flex items-center gap-5 text-rv-dim">
            <a aria-label="X" className="cursor-pointer hover:text-rv-text"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21.5l-7.5 8.59L22.94 22h-6.86l-5.37-7.02L4.56 22H1.3l8.05-9.21L1.06 2h7.04l4.85 6.42L18.244 2zM17.07 20.04h1.92L7.02 3.86H4.96L17.07 20.04z"/></svg></a>
            <a aria-label="LinkedIn" className="cursor-pointer hover:text-rv-text"><Linkedin className="h-4 w-4" /></a>
            <a aria-label="GitHub" className="cursor-pointer hover:text-rv-text"><Github className="h-4 w-4" /></a>
            <a aria-label="YouTube" className="cursor-pointer hover:text-rv-text"><Youtube className="h-4 w-4" /></a>
          </div>
          <div className="font-mono text-[11px] text-rv-dim">© Rivtor 2026 · decision-driven by design</div>
        </div>
      </div>
    </footer>
  );
};
