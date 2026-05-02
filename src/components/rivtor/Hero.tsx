import { motion } from "framer-motion";
import { HeroShader } from "./HeroShader";

export const Hero = () => {
  return (
    <section
      id="hero-section"
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-rv"
    >
      <HeroShader />
      <div className="scanlines pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center px-6 text-center">
        <div className="label-eyebrow mb-8 inline-flex items-center gap-2 text-rv-dim">
          <span className="h-1.5 w-1.5 bg-rv-violet" />
          AUTONOMOUS SOFTWARE COMPANY · IN A BOX
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(2.75rem,7vw,6.25rem)] font-medium leading-[1.02] tracking-[-0.035em] text-rv-text"
        >
          You set direction.
          <br />
          Rivtor runs the company.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          className="mt-8 max-w-[640px] text-[15px] leading-[1.6] text-rv-dim"
        >
          A C-suite of AI agents — CTO, CMO, COO, CFO and a Co-Founder — plan,
          decide, execute and learn on a governed, event-sourced runtime. Every
          action carries a <span className="font-mono text-rv-text">decision_id</span> and a receipt.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <button className="label-eyebrow bg-white px-7 py-4 text-[#050507] transition-colors hover:bg-rv-text">
            JOIN THE PRIVATE BETA
          </button>
          <button className="label-eyebrow hairline px-7 py-4 text-rv-text transition-colors hover:bg-white/[0.04]">
            READ THE ARCHITECTURE →
          </button>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-rv" />
    </section>
  );
};
