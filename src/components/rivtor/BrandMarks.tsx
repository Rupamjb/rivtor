import type { SimpleIcon } from "simple-icons";
import {
  siCursor,
  siGithub,
  siGmail,
  siHubspot,
  siLinear,
  siNotion,
  siPostgresql,
  siResend,
  siSentry,
  siStripe,
  siVercel,
} from "simple-icons";

type MarkProps = {
  className?: string;
  size?: number;
  monochrome?: boolean;
  surface?: "light" | "dark";
};

const darkSurfaceOverrides = {
  Github: "#F5F7FA",
  Notion: "#F5F7FA",
  Vercel: "#F5F7FA",
  Resend: "#F5F7FA",
  Cursor: "#F5F7FA",
} as const;

const Icon24 = ({
  icon,
  size = 24,
  className,
  monochrome = true,
  surface = "light",
  brand,
}: MarkProps & { icon: SimpleIcon; brand?: keyof typeof darkSurfaceOverrides }) => {
  const override = !monochrome && surface === "dark" && brand ? darkSurfaceOverrides[brand] : undefined;
  const fill = monochrome ? "currentColor" : override ?? `#${icon.hex}`;

  return (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    aria-hidden="true"
  >
    <path d={icon.path} fill={fill} />
  </svg>
  );
};

const slackPaths = [
  "M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z",
  "M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z",
  "M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z",
  "M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z",
];

const slackColors = ["#E01E5A", "#36C5F0", "#2EB67D", "#ECB22E"];

export const Slack = ({ size = 24, className, monochrome = true }: MarkProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 127 127"
    className={className}
    fill="none"
    aria-hidden="true"
  >
    {slackPaths.map((path, index) => (
      <path key={path} d={path} fill={monochrome ? "currentColor" : slackColors[index]} />
    ))}
  </svg>
);

export const Linear = (p: MarkProps) => <Icon24 {...p} icon={siLinear} />;
export const Github = (p: MarkProps) => <Icon24 {...p} icon={siGithub} brand="Github" />;
export const Notion = (p: MarkProps) => <Icon24 {...p} icon={siNotion} brand="Notion" />;
export const Stripe = (p: MarkProps) => <Icon24 {...p} icon={siStripe} />;
export const Vercel = (p: MarkProps) => <Icon24 {...p} icon={siVercel} brand="Vercel" />;
export const Postgres = (p: MarkProps) => <Icon24 {...p} icon={siPostgresql} />;
export const Resend = (p: MarkProps) => <Icon24 {...p} icon={siResend} brand="Resend" />;
export const Sentry = (p: MarkProps) => <Icon24 {...p} icon={siSentry} />;
export const Hubspot = (p: MarkProps) => <Icon24 {...p} icon={siHubspot} />;
export const Gmail = (p: MarkProps) => <Icon24 {...p} icon={siGmail} />;
export const Cursor = (p: MarkProps) => <Icon24 {...p} icon={siCursor} brand="Cursor" />;

export const ALL_MARKS = [
  { Mark: Slack, name: "Slack" },
  { Mark: Linear, name: "Linear" },
  { Mark: Github, name: "GitHub" },
  { Mark: Notion, name: "Notion" },
  { Mark: Stripe, name: "Stripe" },
  { Mark: Vercel, name: "Vercel" },
  { Mark: Postgres, name: "Postgres" },
  { Mark: Resend, name: "Resend" },
  { Mark: Sentry, name: "Sentry" },
  { Mark: Hubspot, name: "HubSpot" },
  { Mark: Gmail, name: "Gmail" },
  { Mark: Cursor, name: "Cursor" },
];
