import { useEffect, useState } from "react";

export function useBreakpoint(breakpoint: "sm" | "md" | "lg" | "xl" | "2xl") {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(min-width: ${
        breakpoint === "sm"
          ? "640px"
          : breakpoint === "md"
          ? "768px"
          : breakpoint === "lg"
          ? "1024px"
          : breakpoint === "xl"
          ? "1280px"
          : "1536px"
      })`
    );

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mediaQuery.matches);

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [breakpoint]);

  return matches;
}