import { useEffect, useState } from "react";

export type NavState = "hero" | "dark" | "light";

export function useNavState() {
  const [state, setState] = useState<NavState>("hero");

  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      const lightEl = document.getElementById("light-section");
      const heroEl = document.getElementById("hero-section");

      if (heroEl && y < heroEl.offsetHeight - 80) {
        setState("hero");
        return;
      }
      if (lightEl) {
        const r = lightEl.getBoundingClientRect();
        if (r.top <= 80 && r.bottom >= 80) {
          setState("light");
          return;
        }
      }
      setState("dark");
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return state;
}

export function useScrollState() {
  return useNavState() !== "hero";
}
