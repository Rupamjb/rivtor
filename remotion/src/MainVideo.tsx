import { AbsoluteFill } from "remotion";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
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
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={90}>
          <S1Directive />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade({ shouldFadeOutExitingScene: true })}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <S2Routing />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade({ shouldFadeOutExitingScene: true })}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={100}>
          <S3Taste />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade({ shouldFadeOutExitingScene: true })}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={85}>
          <S4Governance />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade({ shouldFadeOutExitingScene: true })}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={110}>
          <S5DAG />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade({ shouldFadeOutExitingScene: true })}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={80}>
          <S6Integrations />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade({ shouldFadeOutExitingScene: true })}
          timing={linearTiming({ durationInFrames: 18 })}
        />
        <TransitionSeries.Sequence durationInFrames={95}>
          <S7Outcome />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
