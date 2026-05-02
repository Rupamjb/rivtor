import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme, fonts } from "../theme";
import { SceneChrome } from "../components/SceneChrome";

const STAGES = ["DIVERGENCE", "COMPARATIVE", "SIMULATION", "BRAINTRUST", "AUTHORITY", "MEMORY"];
const OPTIONS = [
  { k: "A", t: "behind a feature flag" },
  { k: "B", t: "staged 10/50/100 rollout" },
  { k: "C", t: "full canary on prod" },
];

export const S3Taste = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleIn = spring({ frame, fps, config: { damping: 200 } });
  const activeStage = Math.min(STAGES.length - 1, Math.floor(frame / 14));

  return (
    <SceneChrome
      act="ACT 02 / DECISION"
      title="Taste pipeline ranks long-term outcomes"
      subtitle="Diverge, simulate, critique, authorize, then commit"
      progress={0.43}
    >
      <AbsoluteFill style={{ background: theme.bg, padding: "120px 120px 150px 120px" }}>
        <div style={{ opacity: titleIn, marginBottom: 32 }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 13, color: theme.violet, letterSpacing: "0.18em" }}>
            TASTE PIPELINE
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 44, fontWeight: 600, color: theme.text, letterSpacing: "-0.02em", marginTop: 8 }}>
            Compress long-term consequences into the present.
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 12, marginBottom: 50 }}>
          {STAGES.map((s, i) => {
            const isActive = i === activeStage;
            const isDone = i < activeStage;
            return (
              <div
                key={s}
                style={{
                  border: `1px solid ${isActive ? theme.violet : theme.border}`,
                  background: isActive ? "rgba(124,92,255,0.12)" : "rgba(0,0,0,0.4)",
                  padding: "14px 16px",
                  fontFamily: fonts.mono,
                  fontSize: 12,
                  letterSpacing: "0.1em",
                  color: isActive ? theme.text : isDone ? theme.violet : theme.dim,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isActive ? theme.violet : isDone ? theme.cyan : theme.dim,
                }} />
                {s}
              </div>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {OPTIONS.map((o, i) => {
            const winner = o.k === "B" && frame > 60;
            const inProg = spring({ frame: frame - 20 - i * 6, fps, config: { damping: 200 } });
            return (
              <div
                key={o.k}
                style={{
                  opacity: inProg,
                  transform: `translateY(${(1 - inProg) * 10}px)`,
                  border: `1px solid ${winner ? theme.violet : theme.border}`,
                  background: winner ? "rgba(124,92,255,0.10)" : theme.panel,
                  padding: 22,
                  position: "relative",
                }}
              >
                <div style={{ fontFamily: fonts.mono, fontSize: 12, color: theme.dim, letterSpacing: "0.16em" }}>
                  OPTION {o.k}
                </div>
                <div style={{ fontFamily: fonts.display, fontSize: 22, color: theme.text, marginTop: 10, fontWeight: 500 }}>
                  {o.t}
                </div>
                <div style={{ marginTop: 18, fontFamily: fonts.mono, fontSize: 11, color: theme.dim, lineHeight: 1.7 }}>
                  <div>T+1h · {["+0.1% conv", "+0.4% conv", "+0.6% conv · 2 incidents"][i]}</div>
                  <div>T+24h · {["+1% conv", "+12.4% conv", "+8.0% conv"][i]}</div>
                  <div>T+30d · {["flat", "+6% MRR", "regress -2%"][i]}</div>
                </div>
                {winner && (
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      letterSpacing: "0.16em",
                      color: theme.violet,
                      border: `1px solid ${theme.violet}`,
                      padding: "4px 8px",
                    }}
                  >
                    CHOSEN
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneChrome>
  );
};
