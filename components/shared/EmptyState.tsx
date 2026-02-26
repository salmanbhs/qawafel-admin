import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))] max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
