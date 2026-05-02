import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme, fonts } from "../theme";
import { SceneChrome } from "../components/SceneChrome";

const TEXT = "Ship the Q4 pricing experiment by Friday.";

export const S1Directive = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const markIn = spring({ frame, fps, config: { damping: 200 } });
  const typed = Math.max(0, Math.min(TEXT.length, Math.floor((frame - 14) / 1.4)));
  const caret = Math.floor(frame / 12) % 2 === 0;
  const subIn = interpolate(frame, [70, 95], [0, 1], { extrapolateRight: "clamp" });

  return (
    <SceneChrome
      act="ACT 01 / INTENT"
      title="Directive accepted by Rivtor 01"
      subtitle="Every instruction becomes a traceable decision intent"
      progress={0.14}
    >
      <AbsoluteFill
        style={{
          background: theme.bg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 36,
          padding: "0 120px",
        }}
      >
        <div
          style={{
            opacity: markIn,
            transform: `scale(${0.9 + markIn * 0.1})`,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ width: 22, height: 22, background: theme.violet, transform: "rotate(45deg)" }} />
          <span style={{ fontFamily: fonts.display, fontSize: 36, fontWeight: 600, color: theme.text, letterSpacing: "-0.02em" }}>
            Rivtor
          </span>
        </div>

        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 56,
            fontWeight: 500,
            color: theme.text,
            letterSpacing: "-0.02em",
            maxWidth: 1200,
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          “{TEXT.slice(0, typed)}
          {typed < TEXT.length && caret && <span style={{ color: theme.violet }}>▍</span>}”
        </div>

        <div
          style={{
            opacity: subIn,
            fontFamily: fonts.mono,
            fontSize: 14,
            letterSpacing: "0.16em",
            color: theme.dim,
          }}
        >
          DIRECTIVE → DECISION_ID a1f4e7c2-9b1a
        </div>
      </AbsoluteFill>
    </SceneChrome>
  );
};
