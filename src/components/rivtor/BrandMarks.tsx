import React from "react";

type P = { className?: string; size?: number };

const wrap = (kids: React.ReactNode, p: P) => (
  <svg
    width={p.size ?? 24}
    height={p.size ?? 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={p.className}
    aria-hidden="true"
  >
    {kids}
  </svg>
);

export const Slack = (p: P) =>
  wrap(
    <>
      <rect x="4" y="9" width="16" height="2" />
      <rect x="9" y="4" width="2" height="16" />
      <rect x="4" y="13" width="16" height="2" />
      <rect x="13" y="4" width="2" height="16" />
    </>,
    p
  );

export const Linear = (p: P) =>
  wrap(
    <>
      <path d="M4 14L14 4" />
      <path d="M4 18L18 4" />
      <path d="M8 20L20 8" />
    </>,
    p
  );

export const Github = (p: P) =>
  wrap(
    <>
      <path d="M12 3a9 9 0 0 0-2.85 17.54c.45.08.62-.2.62-.43v-1.5c-2.5.55-3.03-1.2-3.03-1.2-.4-1.04-1-1.32-1-1.32-.83-.57.06-.56.06-.56.92.07 1.4.95 1.4.95.82 1.4 2.15 1 2.67.77.08-.6.32-1 .58-1.23-2-.23-4.1-1-4.1-4.45 0-.98.35-1.78.92-2.4-.1-.23-.4-1.15.08-2.4 0 0 .76-.24 2.5.92a8.6 8.6 0 0 1 4.55 0c1.74-1.16 2.5-.92 2.5-.92.48 1.25.18 2.17.08 2.4.57.62.92 1.42.92 2.4 0 3.46-2.1 4.22-4.1 4.44.33.28.62.83.62 1.68v2.5c0 .24.16.52.62.43A9 9 0 0 0 12 3z" />
    </>,
    p
  );

export const Notion = (p: P) =>
  wrap(
    <>
      <rect x="4" y="4" width="16" height="16" />
      <path d="M8 8v8" />
      <path d="M8 8l8 8" />
      <path d="M16 8v8" />
    </>,
    p
  );

export const Stripe = (p: P) =>
  wrap(
    <>
      <path d="M16 7c-1.5-1-3-1.2-4-1-1.6.3-2.5 1.3-2.5 2.4 0 1.4 1.3 2 3.3 2.6 2.5.7 4.2 1.5 4.2 3.7 0 2.2-2 3.3-4.5 3.3-1.7 0-3.3-.5-4.5-1.4" />
    </>,
    p
  );

export const Vercel = (p: P) =>
  wrap(
    <>
      <path d="M12 4l9 16H3z" />
    </>,
    p
  );

export const Postgres = (p: P) =>
  wrap(
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6" />
      <path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>,
    p
  );

export const Resend = (p: P) =>
  wrap(
    <>
      <path d="M4 6h16v12H4z" />
      <path d="M4 6l8 7 8-7" />
    </>,
    p
  );

export const Sentry = (p: P) =>
  wrap(
    <>
      <path d="M12 4l8 14h-4" />
      <path d="M12 4L4 18h4" />
      <path d="M12 9l4 9h-8" />
    </>,
    p
  );

export const Hubspot = (p: P) =>
  wrap(
    <>
      <circle cx="14" cy="15" r="4" />
      <circle cx="6" cy="7" r="2" />
      <path d="M14 11V7" />
      <path d="M14 7l-6 0" />
    </>,
    p
  );

export const Gmail = (p: P) =>
  wrap(
    <>
      <rect x="3" y="6" width="18" height="12" />
      <path d="M3 6l9 7 9-7" />
    </>,
    p
  );

export const Cursor = (p: P) =>
  wrap(
    <>
      <path d="M5 4l14 8-6 1-2 6z" />
    </>,
    p
  );

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
