import { useEffect, useState, type ReactNode } from "react";
import { useNavState } from "@/lib/useScrollState";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "PRODUCTS", to: "/products", hasArrow: true },
  { label: "SOLUTIONS", to: "/solutions", hasArrow: true },
  { label: "TOOLKITS", to: "/toolkits" },
  { label: "BLOG", to: "/blog" },
  { label: "DOCS", to: "/docs" },
];

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
  to,
  hasArrow,
  light,
  active,
}: {
  children: ReactNode;
  to: string;
  hasArrow?: boolean;
  light?: boolean;
  active?: boolean;
}) => (
  <Link
    to={to}
    className={cn(
      "label-eyebrow flex items-center gap-1 transition-opacity hover:opacity-100",
      light ? "text-[#050507] opacity-80" : "text-rv-text opacity-70",
      active && "opacity-100"
    )}
  >
    {children}
    {hasArrow && <ChevronDown className="h-3 w-3" strokeWidth={2.5} />}
  </Link>
);

export const Navbar = () => {
  const state = useNavState();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const light = state === "light";

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
        bgClass,
        mobileOpen && "bg-[rgba(10,10,12,0.95)] backdrop-blur-md hairline-b"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <Link to="/" aria-label="Rivtor home">
          <RivtorMark light={mobileOpen ? false : light} />
        </Link>
        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <NavItem
              key={link.to}
              to={link.to}
              hasArrow={link.hasArrow}
              light={light}
              active={pathname === link.to}
            >
              {link.label}
            </NavItem>
          ))}
          <Link
            to="/get-started"
            className={cn(
              "label-eyebrow px-4 py-2 transition-colors",
              light ? "bg-[#050507] text-white" : "bg-white text-[#050507]"
            )}
          >
            GET STARTED
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center lg:hidden",
            mobileOpen || !light ? "text-rv-text" : "text-[#050507]"
          )}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden hairline-t bg-rv px-6 pb-5 pt-2">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "label-eyebrow py-3 text-rv-text/85",
                  pathname === link.to && "text-rv-text"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link
            to="/get-started"
            className="label-eyebrow mt-3 inline-flex bg-white px-4 py-2 text-[#050507]"
          >
            GET STARTED
          </Link>
        </div>
      )}
    </nav>
  );
};
