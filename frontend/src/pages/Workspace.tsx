import { Mic, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";


const leftNavItems = ["Dashboard", "Company Brain", "Agents", "Outputs", "Activity", "Settings"];
const contextBadges = ["Founder Notes", "Product Roadmap", "AI Trend Research"];


export default function Workspace() {
  const { signOut } = useAuth();

  return (
    <main className="bg-rv text-rv-text min-h-screen">
      <div className="bg-grid min-h-screen">
        <header className="hairline-b bg-rv/90 sticky top-0 z-10 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
            <div>
              <p className="label-eyebrow text-rv-dim">FounderOS Workspace</p>
              <p className="font-display text-xl">Operational Command Center</p>
            </div>
            <Button variant="outline" className="bg-rv-2" onClick={() => signOut()}>
              Logout
            </Button>
          </div>
        </header>

        <section className="mx-auto grid max-w-[1400px] grid-cols-1 gap-px bg-white/[0.07] lg:grid-cols-[220px_minmax(0,1fr)_320px]">
          <aside className="bg-rv-2 p-4 sm:p-6">
            <p className="label-eyebrow text-rv-dim mb-4">Navigation</p>
            <nav className="space-y-2">
              {leftNavItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="hairline hover:bg-rv flex w-full items-center justify-between px-3 py-2 text-left text-sm transition"
                >
                  <span>{item}</span>
                  <span className="text-rv-dim">•</span>
                </button>
              ))}
            </nav>
          </aside>

          <section className="bg-rv p-4 sm:p-6">
            <div className="hairline bg-rv-2 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="label-eyebrow text-rv-dim">AI Workspace</p>
                  <h2 className="font-display text-2xl">What should FounderOS do next?</h2>
                </div>
                <Button variant="outline" className="bg-rv">
                  <Mic className="mr-2 size-4" />
                  Voice Input
                </Button>
              </div>

              <div className="mt-4 space-y-2 text-sm text-rv-dim">
                <p className="flex items-center gap-2"><Sparkles className="size-4 text-rv-violet" /> retrieving memory...</p>
                <p className="flex items-center gap-2"><Sparkles className="size-4 text-rv-cyan" /> researching web...</p>
                <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-rv-violet" /> preparing approval...</p>
              </div>

              <div className="hairline mt-6 bg-rv p-4">
                <p className="text-rv-dim text-sm">Prompt</p>
                <p className="mt-2 text-sm">
                  Summarize my latest founder notes and draft a launch LinkedIn post in my tone.
                </p>
              </div>
            </div>
          </section>

          <aside className="bg-rv-2 p-4 sm:p-6">
            <p className="label-eyebrow text-rv-dim mb-4">Active Context</p>
            <div className="space-y-3">
              {contextBadges.map((badge) => (
                <div key={badge} className="hairline bg-rv px-3 py-2 text-sm">
                  {badge}
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
