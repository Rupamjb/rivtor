"use client";

import type { ReactNode } from "react";


type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};


export function AuthShell({ eyebrow, title, description, footer, children }: AuthShellProps) {
  return (
    <main className="bg-rv text-rv-text relative min-h-screen overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-[-200px] h-[420px] bg-[radial-gradient(circle_at_top,rgba(124,92,255,0.26),rgba(5,5,7,0))]" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-[minmax(0,460px)_1fr] lg:py-20">
        <div className="order-2 hidden lg:block">
          <div className="hairline bg-rv-2 p-8">
            <p className="label-eyebrow text-rv-dim">FounderOS Access</p>
            <h2 className="font-display mt-5 max-w-md text-3xl leading-tight">
              Your AI-native founder workspace starts with secure sign-in.
            </h2>
            <p className="text-rv-dim mt-4 max-w-md text-sm leading-6">
              Persistent memory, specialized agents, and approval-first workflows in one operational control layer.
            </p>
            <div className="mt-6 space-y-2 text-sm text-rv-dim">
              <p>retrieving founder context...</p>
              <p>loading activity timeline...</p>
              <p>syncing workspace state...</p>
            </div>
          </div>
        </div>

        <div
          data-testid="auth-card"
          className="hairline bg-rv-2 order-1 w-full max-w-[460px] justify-self-center p-7 sm:p-9 lg:justify-self-start"
        >
          <p className="label-eyebrow text-rv-dim">{eyebrow}</p>
          <h1 className="font-display mt-5 text-3xl leading-tight sm:text-4xl">{title}</h1>
          <p className="text-rv-dim mt-3 text-sm leading-6">{description}</p>

          <div className="mt-7">{children}</div>

          <div className="text-rv-dim mt-6 text-sm">{footer}</div>
        </div>
      </section>
    </main>
  );
}
