import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme, fonts } from "../theme";
import { SceneChrome } from "../components/SceneChrome";

const ROLES = [
  { k: "CTO", t: "Engineering", angle: -100 },
  { k: "CMO", t: "Growth", angle: -40 },
  { k: "COO", t: "Operations", angle: 20 },
  { k: "CFO", t: "Finance", angle: 80 },
  { k: "CO-FOUNDER", t: "Strategy", angle: 140 },
];

const cx = 960;
const cy = 540;
const R = 320;

export const S2Routing = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hubIn = spring({ frame, fps, config: { damping: 200 } });

  return (
    <SceneChrome
      act="ACT 02 / ROUTING"
      title="C-suite coordination over a shared bus"
      subtitle="Intent is delegated by domain while preserving context"
      progress={0.29}
    >
      <AbsoluteFill style={{ background: theme.bg }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
          {ROLES.map((r, i) => {
            const a = (r.angle * Math.PI) / 180;
            const x = cx + Math.cos(a) * R;
            const y = cy + Math.sin(a) * R;
            const prog = interpolate(frame, [20 + i * 6, 50 + i * 6], [0, 1], {
              extrapolateRight: "clamp",
            });
            const dash = 600;
            return (
              <line
                key={r.k}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke={theme.violet}
                strokeWidth={1.5}
                strokeOpacity={0.7}
                strokeDasharray={dash}
                strokeDashoffset={dash * (1 - prog)}
              />
            );
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            left: cx - 90,
            top: cy - 36,
            width: 180,
            opacity: hubIn,
            transform: `scale(${0.9 + hubIn * 0.1})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 6,
            background: theme.bg2,
            border: `1px solid ${theme.violet}`,
            padding: "14px 18px",
          }}
        >
          <div style={{ fontFamily: fonts.mono, fontSize: 11, color: theme.violet, letterSpacing: "0.12em" }}>
            RIVTOR 01
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 18, fontWeight: 600, color: theme.text }}>
            Orchestrator
          </div>
        </div>

        {ROLES.map((r, i) => {
          const a = (r.angle * Math.PI) / 180;
          const x = cx + Math.cos(a) * R;
          const y = cy + Math.sin(a) * R;
          const prog = spring({ frame: frame - 30 - i * 6, fps, config: { damping: 200 } });
          return (
            <div
              key={r.k}
              style={{
                position: "absolute",
                left: x - 90,
                top: y - 30,
                width: 180,
                opacity: prog,
                transform: `translateY(${(1 - prog) * 8}px)`,
                background: theme.panel,
                border: `1px solid ${theme.border}`,
                padding: "10px 14px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: fonts.mono, fontSize: 10, color: theme.dim, letterSpacing: "0.12em" }}>
                {r.k}
              </div>
              <div style={{ fontFamily: fonts.display, fontSize: 16, color: theme.text, marginTop: 2 }}>
                {r.t}
              </div>
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            bottom: 120,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: fonts.mono,
            fontSize: 13,
            letterSpacing: "0.14em",
            color: theme.dim,
          }}
        >
          INTENT: pricing_experiment · DOMAIN: growth · TIER: PRO
        </div>
      </AbsoluteFill>
    </SceneChrome>
  );
};
