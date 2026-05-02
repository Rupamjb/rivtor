import type { ReactNode } from "react";
import { useNavState } from "@/lib/useScrollState";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const RivtorMark = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center gap-2">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4h12l4 4v12H8l-4-4V4z"
        stroke={light ? "#050507" : "#F5F7FA"}
        strokeWidth="1.6"
      />
      <path
        d="M4 4l4 4h12"
        stroke={light ? "#050507" : "#F5F7FA"}
        strokeWidth="1.6"
      />
      <circle cx="12" cy="13" r="2" fill="#7C5CFF" />
    </svg>
    <span
      className={cn(
        "font-display text-[18px] font-semibold tracking-tight",
        light ? "text-[#050507]" : "text-rv-text"
      )}
    >
      Rivtor
    </span>
  </div>
);

const NavItem = ({
  children,
  hasArrow,
  light,
}: {
  children: ReactNode;
  hasArrow?: boolean;
  light?: boolean;
}) => (
  <button
    className={cn(
      "label-eyebrow flex items-center gap-1 transition-opacity hover:opacity-100",
      light ? "text-[#050507] opacity-80" : "text-rv-text opacity-70"
    )}
  >
    {children}
    {hasArrow && <ChevronDown className="h-3 w-3" strokeWidth={2.5} />}
  </button>
);

export const Navbar = () => {
  const state = useNavState();
  const light = state === "light";

  const bgClass =
    state === "hero"
      ? "bg-transparent"
      : state === "dark"
      ? "bg-[rgba(10,10,12,0.7)] backdrop-blur-md hairline-b"
      : "bg-white hairline-b border-b border-black/10";

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300",
        bgClass
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <RivtorMark light={light} />
        <div className="hidden items-center gap-8 lg:flex">
          <NavItem hasArrow light={light}>
            PRODUCTS
          </NavItem>
          <NavItem hasArrow light={light}>
            SOLUTIONS
          </NavItem>
          <NavItem light={light}>TOOLKITS</NavItem>
          <NavItem light={light}>BLOG</NavItem>
          <NavItem light={light}>DOCS</NavItem>
          <button
            className={cn(
              "label-eyebrow px-4 py-2 transition-colors",
              light ? "bg-[#050507] text-white" : "bg-white text-[#050507]"
            )}
          >
            GET STARTED
          </button>
        </div>
      </div>
    </nav>
  );
};
