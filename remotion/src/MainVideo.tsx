import { AbsoluteFill, Series } from "remotion";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import { theme, fonts } from "./theme";
import { Backdrop } from "./scenes/Backdrop";
import { S1Directive } from "./scenes/S1Directive";
import { S2Routing } from "./scenes/S2Routing";
import { S3Taste } from "./scenes/S3Taste";
import { S4Governance } from "./scenes/S4Governance";
import { S5DAG } from "./scenes/S5DAG";
import { S6Integrations } from "./scenes/S6Integrations";
import { S7Outcome } from "./scenes/S7Outcome";

loadInterTight();
loadInter();
loadJetBrains();

export const MainVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg, fontFamily: fonts.body }}>
      <Backdrop />
      <Series>
        <Series.Sequence durationInFrames={90}>
          <S1Directive />
        </Series.Sequence>
        <Series.Sequence durationInFrames={90}>
          <S2Routing />
        </Series.Sequence>
        <Series.Sequence durationInFrames={100}>
          <S3Taste />
        </Series.Sequence>
        <Series.Sequence durationInFrames={80}>
          <S4Governance />
        </Series.Sequence>
        <Series.Sequence durationInFrames={110}>
          <S5DAG />
        </Series.Sequence>
        <Series.Sequence durationInFrames={70}>
          <S6Integrations />
        </Series.Sequence>
        <Series.Sequence durationInFrames={90}>
          <S7Outcome />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
