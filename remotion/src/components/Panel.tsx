import React from "react";
import { theme, fonts } from "../theme";

export const Panel: React.FC<{
  label?: string;
  rightLabel?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ label, rightLabel, children, style }) => (
  <div
    style={{
      backgroundColor: theme.panel,
      border: `1px solid ${theme.border}`,
      padding: 24,
      backdropFilter: "blur(0px)",
      ...style,
    }}
  >
    {(label || rightLabel) && (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 18,
          fontFamily: fonts.mono,
          fontSize: 12,
          letterSpacing: "0.08em",
          color: theme.dim,
          textTransform: "uppercase",
        }}
      >
        <span>{label}</span>
        {rightLabel && <span>{rightLabel}</span>}
      </div>
    )}
    {children}
  </div>
);