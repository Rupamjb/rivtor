import type { SimpleIcon } from "simple-icons";
import {
  siGithub,
  siLinear,
  siNotion,
  siPostgresql,
  siResend,
  siSentry,
  siStripe,
  siVercel,
} from "simple-icons";

type P = { size?: number; color?: string; monochrome?: boolean };

const Icon24 = ({ icon, size = 24, color, monochrome = true }: P & { icon: SimpleIcon }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={icon.path} fill={color ?? (monochrome ? "currentColor" : `#${icon.hex}`)} />
  </svg>
);

const slackPaths = [
  "M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z",
  "M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z",
  "M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z",
  "M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z",
];

const slackColors = ["#E01E5A", "#36C5F0", "#2EB67D", "#ECB22E"];

export const Slack = ({ size = 24, color, monochrome = true }: P) => (
  <svg width={size} height={size} viewBox="0 0 127 127" fill="none" aria-hidden="true">
    {slackPaths.map((path, i) => (
      <path key={path} d={path} fill={color ?? (monochrome ? "currentColor" : slackColors[i])} />
    ))}
  </svg>
);

export const Linear = (p: P) => <Icon24 {...p} icon={siLinear} />;
export const Github = (p: P) => <Icon24 {...p} icon={siGithub} />;
export const Notion = (p: P) => <Icon24 {...p} icon={siNotion} />;
export const Stripe = (p: P) => <Icon24 {...p} icon={siStripe} />;
export const Vercel = (p: P) => <Icon24 {...p} icon={siVercel} />;
export const Postgres = (p: P) => <Icon24 {...p} icon={siPostgresql} />;
export const Resend = (p: P) => <Icon24 {...p} icon={siResend} />;
export const Sentry = (p: P) => <Icon24 {...p} icon={siSentry} />;
