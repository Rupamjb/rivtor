import { ALL_MARKS } from "./BrandMarks";

export const LogoStrip = () => {
  const items = [...ALL_MARKS, ...ALL_MARKS];
  return (
    <section className="relative overflow-hidden bg-rv py-14 hairline-t hairline-b">
      <div className="mx-auto mb-8 max-w-[1400px] px-6">
        <div className="label-eyebrow inline-flex items-center gap-2 text-rv-dim">
          <span className="h-1.5 w-1.5 bg-rv-violet" />
          WIRES INTO YOUR EXISTING STACK
        </div>
      </div>
      <div className="flex w-max animate-marquee items-center gap-14 px-8 text-rv-text/65">
        {items.map(({ Mark, name }, i) => (
          <div key={i} className="flex items-center gap-3 opacity-80 transition-opacity hover:opacity-100">
            <Mark size={26} />
            <span className="font-display text-[18px] font-medium tracking-tight">{name}</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-rv to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-rv to-transparent" />
    </section>
  );
};
