"use client";

import Link from "next/link";

import { PageFrame } from "@/components/rivtor/PageFrame";
import { useAuth } from "@/context/AuthContext";
import { getStartedDestination } from "@/lib/auth-routing";

const steps = [
  "Connect workspace and core systems",
  "Define authority and budget policies",
  "Run your first directive through Rivtor 01",
  "Review outcome receipts and tune autonomy",
];

const GetStarted = () => {
  const { user } = useAuth();
  const ctaHref = getStartedDestination(Boolean(user));

  return (
    <PageFrame
      eyebrow="GET STARTED"
      title="Launch your autonomous company workflow"
      description="Go from setup to first shipped outcome with decision-level visibility from day one."
    >
      <div className="mx-auto max-w-[920px] hairline bg-rv-2 p-6 sm:p-8 lg:p-10">
        <ol className="space-y-5">
          {steps.map((step, i) => (
            <li key={step} className="flex gap-4">
              <span className="label-eyebrow mt-0.5 inline-flex h-6 w-6 items-center justify-center bg-rv-violet text-[10px] text-white">
                {i + 1}
              </span>
              <span className="text-[15px] text-rv-text/90">{step}</span>
            </li>
          ))}
        </ol>
        <Link
          href={ctaHref}
          className="label-eyebrow mt-10 inline-flex w-full justify-center bg-white px-6 py-3 text-[#050507] sm:w-auto"
        >
          REQUEST PRIVATE BETA ACCESS
        </Link>
      </div>
    </PageFrame>
  );
};

export default GetStarted;
