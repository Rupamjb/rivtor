"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const HeroShader = dynamic(
  () => import("./HeroShader").then((module) => module.HeroShader),
  { ssr: false },
);

export const Hero = () => {
  return (
    <section
      id="hero-section"
      className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-rv pb-16 pt-24 sm:pb-20 sm:pt-28"
    >
      <HeroShader />
      <div className="scanlines pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center px-6 text-center">
        <div className="label-eyebrow mb-7 inline-flex items-center gap-2 text-rv-dim sm:mb-8">
          <span className="h-1.5 w-1.5 bg-rv-violet" />
          AUTONOMOUS SOFTWARE COMPANY · IN A BOX
        </div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(2.1rem,10vw,6.25rem)] font-medium leading-[1.02] tracking-[-0.035em] text-rv-text"
        >
          You set direction.
          <br />
          Rivtor runs the company.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
          className="mt-7 max-w-[640px] text-[14px] leading-[1.6] text-rv-dim sm:mt-8 sm:text-[15px]"
        >
          A C-suite of AI agents — CTO, CMO, COO, CFO and a Co-Founder — plan,
          decide, execute and learn on a governed, event-sourced runtime. Every
          action carries a <span className="font-mono text-rv-text">decision_id</span> and a receipt.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-10 flex w-full flex-col items-center justify-center gap-3 sm:mt-12 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4"
        >
          <button className="label-eyebrow w-full bg-white px-7 py-4 text-[#050507] transition-colors hover:bg-rv-text sm:w-auto">
            JOIN THE PRIVATE BETA
          </button>
          <button className="label-eyebrow hairline hidden w-full px-7 py-4 text-rv-text transition-colors hover:bg-white/[0.04] sm:inline-flex sm:w-auto">
            READ THE ARCHITECTURE →
          </button>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-rv" />
    </section>
  );
};
