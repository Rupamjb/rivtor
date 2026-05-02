import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";

export const Backdrop = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 600], [0, 80]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at 50% 50%, rgba(124,92,255,0.18), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
          backgroundPosition: `${drift}px ${drift}px`,
          opacity: 0.4,
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
