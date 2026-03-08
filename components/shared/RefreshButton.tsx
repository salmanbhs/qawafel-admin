"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCooldownRemaining, COOLDOWN_MS } from "@/hooks/use-reference-data";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  cooldownKey: string;
  onRefresh: () => number; // returns remaining cooldown ms (0 = refreshed)
  label?: string;
  className?: string;
  isRefetching?: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function RefreshButton({
  cooldownKey,
  onRefresh,
  label,
  className,
  isRefetching,
}: RefreshButtonProps) {
  const [remaining, setRemaining] = useState(() => getCooldownRemaining(cooldownKey));

  // Tick the countdown every second
  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      const r = getCooldownRemaining(cooldownKey);
      setRemaining(r);
      if (r <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining, cooldownKey]);

  const handleClick = useCallback(() => {
    const r = onRefresh();
    setRemaining(r || COOLDOWN_MS);
  }, [onRefresh]);

  const isDisabled = remaining > 0 || isRefetching;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isDisabled}
      className={cn("gap-1.5 h-7 px-2 text-xs", className)}
    >
      <RefreshCw className={cn("h-3 w-3", isRefetching && "animate-spin")} />
      {remaining > 0 ? formatTime(remaining) : label}
    </Button>
  );
}
