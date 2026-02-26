"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Building2,
  Package,
  MapPin,
  MessageSquare,
  Users,
  ClipboardList,
  Hotel,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";

  const navItems = [
    {
      href: `/${locale}`,
      label: t("dashboard"),
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: `/${locale}/agencies`,
      label: t("agencies"),
      icon: Building2,
    },
    {
      href: `/${locale}/hotels`,
      label: t("hotels"),
      icon: Hotel,
    },
    {
      href: `/${locale}/contact-logs`,
      label: t("contactLogs"),
      icon: MessageSquare,
    },
  ];

  const adminItems = [
    {
      href: `/${locale}/destinations`,
      label: t("destinations"),
      icon: MapPin,
    },
    {
      href: `/${locale}/admin/users`,
      label: t("users"),
      icon: Users,
    },
    {
      href: `/${locale}/admin/audit-logs`,
      label: t("auditLogs"),
      icon: ClipboardList,
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-full w-[260px] flex-col bg-[hsl(var(--card))] border-e border-[hsl(var(--border))]">
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold text-lg">
            ق
          </div>
          <div>
            <p className="font-bold text-sm leading-none">قافلة</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Admin</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive(item.href, item.exact)
                ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                {t("admin")}
              </p>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info at bottom */}
      {user && (
        <div className="p-4 border-t border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-bold">
              {user.email.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.role.replace(/_/g, " ")}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
