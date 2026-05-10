import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { theme, fonts } from "../theme";
import * as Brand from "../components/IconBrand";
import { SceneChrome } from "../components/SceneChrome";

const ITEMS = [
  { Mark: Brand.Slack, name: "Slack", note: "ROUTED → CTO" },
  { Mark: Brand.Linear, name: "Linear", note: "DECISION_ID a1f4…" },
  { Mark: Brand.Github, name: "GitHub", note: "PR #482 OPENED" },
  { Mark: Brand.Notion, name: "Notion", note: "MEMO PUBLISHED" },
  { Mark: Brand.Stripe, name: "Stripe", note: "MRR RECONCILED" },
  { Mark: Brand.Postgres, name: "Postgres", note: "MIGRATION OK" },
  { Mark: Brand.Vercel, name: "Vercel", note: "DEPLOY 50%" },
  { Mark: Brand.Sentry, name: "Sentry", note: "P0 PATCHED" },
];

export const S6Integrations = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <SceneChrome
      act="ACT 04 / INTEGRATIONS"
      title="Execution spans your existing stack"
      subtitle="Real systems, one governed control surface"
      progress={0.86}
    >
      <AbsoluteFill style={{ background: theme.bg, padding: "120px 140px 140px 140px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: fonts.mono, fontSize: 13, color: theme.violet, letterSpacing: "0.18em" }}>
            GOVERNED EXECUTION · across your stack
          </div>
          <div style={{ fontFamily: fonts.display, fontSize: 44, fontWeight: 600, color: theme.text, letterSpacing: "-0.02em", marginTop: 8 }}>
            One company. Every tool.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {ITEMS.map((it, i) => {
            const inProg = spring({ frame: frame - i * 4, fps, config: { damping: 200 } });
            const Mark = it.Mark;
            return (
              <div
                key={it.name}
                style={{
                  opacity: inProg,
                  transform: `translateY(${(1 - inProg) * 10}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  border: `1px solid ${theme.border}`,
                  background: theme.panel,
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                  }}
                >
                  <Mark size={22} color={theme.text} />
                </div>
                <div>
                  <div style={{ fontFamily: fonts.display, fontSize: 18, color: theme.text }}>
                    {it.name}
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 10, color: theme.cyan, letterSpacing: "0.16em", marginTop: 2 }}>
                    ● {it.note}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </SceneChrome>
  );
};
