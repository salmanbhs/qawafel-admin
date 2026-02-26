"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ShieldOff } from "lucide-react";

import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";

export function AdminGuard({ children }: { children: ReactNode }) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  if (user?.role !== "SYSTEM_ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">{t("accessDenied")}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{t("accessDeniedDesc")}</p>
        <Button variant="outline" onClick={() => router.back()}>{tc("back")}</Button>
      </div>
    );
  }

  return <>{children}</>;
}
