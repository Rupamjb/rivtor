import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme, fonts } from "../theme";
import { SceneChrome } from "../components/SceneChrome";

const CHECKS = [
  ["AUTHORITY", "CTO scope · OK", "ok"],
  ["BUDGET", "$1,240 / $5,000", "ok"],
  ["REVERSIBILITY", "rollback ≤ 90s", "ok"],
  ["RISK", "policy 0028 · approval needed", "wait"],
];

export const S4Governance = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const stamp = interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SceneChrome
      act="ACT 03 / GOVERNANCE"
      title="Policy gates enforce safe execution"
      subtitle="Authority, budget, reversibility, and risk are checked before action"
      progress={0.57}
    >
      <AbsoluteFill
        style={{
          background: theme.bg,
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 90,
        }}
      >
        <div
          style={{
            width: 780,
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            padding: 36,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 12, color: theme.dim, letterSpacing: "0.16em" }}>
              POLICY_GATE · fail-closed
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: 11, color: theme.violet, border: `1px solid ${theme.violet}`, padding: "4px 8px", letterSpacing: "0.16em" }}>
              TIER · PRO
            </div>
          </div>

          {CHECKS.map(([k, v, s], i) => {
            const inProg = spring({ frame: frame - 8 - i * 8, fps, config: { damping: 200 } });
            return (
              <div
                key={k}
                style={{
                  opacity: inProg,
                  transform: `translateY(${(1 - inProg) * 8}px)`,
                  display: "grid",
                  gridTemplateColumns: "180px 1fr 40px",
                  alignItems: "center",
                  padding: "16px 18px",
                  marginBottom: 8,
                  background: "rgba(0,0,0,0.4)",
                  border: `1px solid ${theme.border}`,
                  fontFamily: fonts.mono,
                  fontSize: 13,
                }}
              >
                <span style={{ color: theme.dim, letterSpacing: "0.12em" }}>{k}</span>
                <span style={{ color: theme.text }}>{v}</span>
                <span style={{ color: s === "ok" ? theme.cyan : "#f59e0b", textAlign: "right", fontSize: 18 }}>
                  {s === "ok" ? "✓" : "!"}
                </span>
              </div>
            );
          })}

          <div
            style={{
              opacity: stamp,
              transform: `scale(${0.9 + stamp * 0.1}) rotate(-4deg)`,
              position: "absolute",
              right: -20,
              bottom: -20,
              border: `2px solid ${theme.violet}`,
              color: theme.violet,
              fontFamily: fonts.mono,
              fontSize: 18,
              letterSpacing: "0.18em",
              padding: "10px 18px",
              background: "rgba(124,92,255,0.08)",
            }}
          >
            APPROVED
          </div>
        </div>
      </AbsoluteFill>
    </SceneChrome>
  );
};
