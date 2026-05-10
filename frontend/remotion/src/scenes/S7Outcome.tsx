import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme, fonts } from "../theme";
import { SceneChrome } from "../components/SceneChrome";

export const S7Outcome = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardIn = spring({ frame, fps, config: { damping: 200 } });
  const learnIn = interpolate(frame, [40, 65], [0, 1], { extrapolateRight: "clamp" });
  const markIn = interpolate(frame, [60, 75], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SceneChrome
      act="ACT 04 / OUTCOME"
      title="Measured gain with learning feedback"
      subtitle="Rivtor closes the loop from action to improved future decisions"
      progress={1}
    >
      <AbsoluteFill
        style={{
          background: theme.bg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 28,
          paddingBottom: 120,
        }}
      >
        <div
          style={{
            opacity: cardIn,
            transform: `translateY(${(1 - cardIn) * 12}px)`,
            width: 760,
            border: `1px solid ${theme.violet}`,
            background: "rgba(124,92,255,0.08)",
            padding: 32,
          }}
        >
          <div style={{ fontFamily: fonts.mono, fontSize: 12, color: theme.violet, letterSpacing: "0.18em" }}>
            OUTCOME · SHIPPED
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 36, color: theme.text, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 10 }}>
            pricing-v2 · +12.4% conv (T+24h)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, marginTop: 22, fontFamily: fonts.mono, fontSize: 12 }}>
            <div>
              <div style={{ color: theme.dim, letterSpacing: "0.12em" }}>P95</div>
              <div style={{ color: theme.text, marginTop: 4 }}>184ms</div>
            </div>
            <div>
              <div style={{ color: theme.dim, letterSpacing: "0.12em" }}>INCIDENTS</div>
              <div style={{ color: theme.text, marginTop: 4 }}>0</div>
            </div>
            <div>
              <div style={{ color: theme.dim, letterSpacing: "0.12em" }}>SPEND</div>
              <div style={{ color: theme.text, marginTop: 4 }}>$1,240 / $5,000</div>
            </div>
          </div>
        </div>

        <div
          style={{
            opacity: learnIn,
            fontFamily: fonts.mono,
            fontSize: 13,
            color: theme.dim,
            letterSpacing: "0.16em",
          }}
        >
          LEARNING_LOOP → CREDIT_ASSIGNED → TASTE_MEMORY UPDATED
        </div>

        <div
          style={{
            opacity: markIn,
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 18, height: 18, background: theme.violet, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: fonts.display, fontSize: 32, fontWeight: 600, color: theme.text, letterSpacing: "-0.02em" }}>
            Rivtor
          </span>
        </div>
      </AbsoluteFill>
    </SceneChrome>
  );
};
