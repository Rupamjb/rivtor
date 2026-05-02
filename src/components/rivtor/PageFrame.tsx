import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

type PageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export const PageFrame = ({ eyebrow, title, description, children }: PageFrameProps) => {
  return (
    <>
      <Navbar />
      <main className="bg-rv pt-16 text-rv-text">
        <section className="hairline-b bg-rv">
          <div className="mx-auto max-w-[1400px] px-6 py-14 sm:py-16 lg:py-24">
            <div className="label-eyebrow mb-6 inline-flex items-center gap-2 text-rv-dim">
              <span className="h-1.5 w-1.5 bg-rv-violet" />
              {eyebrow}
            </div>
            <h1 className="font-display max-w-[920px] text-[clamp(1.65rem,8.2vw,4.5rem)] font-medium leading-[1.03] tracking-[-0.03em]">
              {title}
            </h1>
            <p className="mt-6 max-w-[720px] text-[14px] leading-[1.7] text-rv-dim sm:mt-8 sm:text-[15px]">{description}</p>
          </div>
        </section>

        <section className="bg-rv py-14 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-[1400px] px-6">{children}</div>
        </section>
      </main>
      <Footer />
    </>
  );
};
