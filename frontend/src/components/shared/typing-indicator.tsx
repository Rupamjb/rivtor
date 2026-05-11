import { motion } from "framer-motion";


export function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-zinc-300/70"
          animate={{
            y: [0, -2, 0],
            opacity: [0.35, 1, 0.35],
          }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            delay: index * 0.12,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
