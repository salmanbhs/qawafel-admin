"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

type StatusType =
  | "DRAFT" | "PUBLISHED" | "ARCHIVED"
  | "PENDING" | "APPROVED" | "REJECTED" | "ACTIVE"
  | "CONFIRMED" | "UNCONFIRMED";

const statusVariantMap: Record<StatusType, VariantProps<typeof badgeVariants>["variant"]> = {
  DRAFT: "secondary",
  PUBLISHED: "success",
  ARCHIVED: "outline",
  PENDING: "warning",
  APPROVED: "info",
  REJECTED: "destructive",
  ACTIVE: "success",
  CONFIRMED: "success",
  UNCONFIRMED: "warning",
};

interface StatusBadgeProps {
  status: StatusType | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations("status");
  const variant = statusVariantMap[status as StatusType] ?? "secondary";
  const label = t(status as StatusType) ?? status;

  return <Badge variant={variant}>{label}</Badge>;
}
