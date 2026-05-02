import { useEffect, useRef, useState } from "react";

export const ProductVideo = () => {
  const ref = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          setVisible(e.isIntersecting);
          const v = ref.current;
          if (!v) continue;
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={wrapRef}
      className="relative bg-rv py-32"
      aria-label="Rivtor decision and execution loop"
    >
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-10 flex items-end justify-between gap-8">
          <div>
            <div className="label-eyebrow mb-4 inline-flex items-center gap-2 text-rv-dim">
              <span className="h-1.5 w-1.5 bg-rv-violet" />
              THE LOOP
            </div>
            <h2 className="font-display max-w-[820px] text-[clamp(1.75rem,3.6vw,3rem)] font-semibold leading-[1.05] text-rv-text">
              Directive in. Shipped outcome out.
            </h2>
          </div>
          <p className="hidden max-w-[380px] text-[14px] leading-relaxed text-rv-dim lg:block">
            Rivtor 01 routes intent to the right specialist agent, runs the
            Taste pipeline to choose between options, enforces governance, and
            executes a DAG of sandboxed tasks — every step appended to an
            event log.
          </p>
        </div>

        <div className="relative overflow-hidden hairline bg-black">
          <div style={{ paddingTop: "56.25%" }} />
          <video
            ref={ref}
            className="absolute inset-0 h-full w-full object-cover"
            src="/rivtor-demo.mp4"
            muted
            playsInline
            loop
            preload="metadata"
          />
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
              visible ? "opacity-0" : "opacity-100"
            }`}
            style={{
              background:
                "radial-gradient(60% 60% at 50% 50%, transparent, rgba(5,5,7,0.7))",
            }}
          />
        </div>

        <div className="mt-px grid grid-cols-2 gap-px bg-white/[0.06] hairline lg:grid-cols-4">
          {[
            ["DIRECTIVE", "natural-language brief"],
            ["DECISION", "diverged · simulated · committed"],
            ["GOVERNED EXECUTION", "sandboxed · reversible"],
            ["EVENT-SOURCED OUTCOME", "200 OK · receipts logged"],
          ].map(([k, v]) => (
            <div key={k} className="bg-rv px-5 py-4">
              <div className="label-eyebrow mb-1 text-rv-dim">{k}</div>
              <div className="font-mono text-[12px] text-rv-text/85">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
