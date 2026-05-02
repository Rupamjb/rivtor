import { ALL_MARKS } from "./BrandMarks";

export const LogoStrip = () => {
  const items = [...ALL_MARKS, ...ALL_MARKS];
  return (
    <section className="relative overflow-hidden bg-rv py-10 hairline-t hairline-b sm:py-14">
      <div className="mx-auto mb-6 max-w-[1400px] px-6 sm:mb-8">
        <div className="label-eyebrow inline-flex items-center gap-2 text-rv-dim">
          <span className="h-1.5 w-1.5 bg-rv-violet" />
          WIRES INTO YOUR EXISTING STACK
        </div>
      </div>
      <div className="flex w-max animate-marquee items-center gap-10 px-6 text-rv-text/75 sm:gap-14 sm:px-8">
        {items.map(({ Mark, name }, i) => (
          <div key={i} className="flex items-center gap-3 opacity-80 transition-opacity hover:opacity-100">
            <Mark size={22} monochrome={false} />
            <span className="font-display hidden text-[18px] font-medium tracking-tight sm:inline">{name}</span>
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-rv to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-rv to-transparent" />
    </section>
  );
};
