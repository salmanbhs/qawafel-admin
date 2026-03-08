"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef(pathname);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (pathname === prevPathRef.current) return;
    prevPathRef.current = pathname;

    // Navigation completed — finish the bar
    setProgress(100);
    cleanup();
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 300);

    return cleanup;
  }, [pathname, cleanup]);

  // Intercept link clicks to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (anchor.target === "_blank") return;

      // Start progress
      cleanup();
      setVisible(true);
      setProgress(30);
      timerRef.current = setTimeout(() => setProgress(60), 200);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [cleanup]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="fixed top-0 start-0 end-0 z-[9999] h-0.5 pointer-events-none"
      role="progressbar"
      aria-valuenow={progress}
    >
      <div
        className="h-full bg-[hsl(var(--primary))] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 0
            ? "none"
            : "width 300ms ease-out, opacity 300ms ease-out 200ms",
        }}
      />
    </div>
  );
}
