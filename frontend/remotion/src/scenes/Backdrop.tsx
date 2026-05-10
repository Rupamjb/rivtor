import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";

export const Backdrop = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 600], [0, 72]);
  const glowX = interpolate(frame, [0, 630], [22, 74]);
  const glowY = interpolate(frame, [0, 630], [38, 62]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 560px at ${glowX}% ${glowY}%, rgba(124,92,255,0.20), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(700px 420px at 78% 20%, rgba(0,212,255,0.14), transparent 68%)",
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
          backgroundSize: "54px 54px",
          backgroundPosition: `${drift}px ${drift}px`,
          opacity: 0.3,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.024) 0px, rgba(255,255,255,0.024) 1px, transparent 1px, transparent 3px)",
          opacity: 0.26,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 35%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
