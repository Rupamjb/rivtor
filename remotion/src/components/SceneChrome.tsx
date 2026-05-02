import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { fonts, theme } from "../theme";

type SceneChromeProps = {
  act: string;
  title: string;
  subtitle: string;
  progress: number;
  children: ReactNode;
};

export const SceneChrome = ({ act, title, subtitle, progress, children }: SceneChromeProps) => {
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", inset: "34px 52px auto 52px", zIndex: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div style={{ fontFamily: fonts.mono, fontSize: 11, letterSpacing: "0.16em", color: theme.dim }}>
            {act}
          </div>
          <div style={{ fontFamily: fonts.mono, fontSize: 10, letterSpacing: "0.16em", color: theme.dim }}>
            RIVTOR LAUNCH FILM
          </div>
        </div>
        <div
          style={{
            height: 2,
            width: "100%",
            background: "rgba(255,255,255,0.12)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, progress * 100))}%`,
              height: "100%",
              background: "linear-gradient(90deg, #7C5CFF, #00D4FF)",
            }}
          />
        </div>
      </div>

      {children}

      <div style={{ position: "absolute", left: 52, right: 52, bottom: 34, zIndex: 20 }}>
        <div style={{ fontFamily: fonts.display, fontSize: 32, color: theme.text, letterSpacing: "-0.02em", fontWeight: 600 }}>
          {title}
        </div>
        <div style={{ marginTop: 6, fontFamily: fonts.mono, fontSize: 12, color: theme.dim, letterSpacing: "0.14em" }}>
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
