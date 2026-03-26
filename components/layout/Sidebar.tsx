"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Building2,
  Package,
  MapPin,
  Globe,
  MessageSquare,
  Users,
  ClipboardList,
  Hotel,
  LogOut,
  X,
  ShieldCheck,
  Briefcase,
  Instagram,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { apiPost } from "@/lib/api";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAdmin = user?.role === "SYSTEM_ADMIN";
  const isAgencyRole =
    user?.role === "TRAVEL_AGENCY_ADMIN" ||
    user?.role === "TRAVEL_AGENCY_STAFF";

  const agencyId = user?.travelAgencyId;

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) await apiPost("/auth/logout", { refreshToken });
    } catch {
      // ignore
    }
    clearAuth();
    router.push(`/${locale}/login`);
  }

  // Items visible to everyone
  const mainItems = [
    {
      href: `/${locale}`,
      label: t("dashboard"),
      icon: LayoutDashboard,
      exact: true,
      show: true,
    },
    {
      href: `/${locale}/hotels`,
      label: t("hotels"),
      icon: Hotel,
      show: true,
    },
    // Agency shortcuts — only for non-system-admin users who have a linked agency
    {
      href: `/${locale}/agencies/${agencyId}`,
      label: t("myAgency"),
      icon: Briefcase,
      show: isAgencyRole && !!agencyId,
    },
    {
      href: `/${locale}/agencies/${agencyId}/offers`,
      label: t("offers"),
      icon: Package,
      show: isAgencyRole && !!agencyId,
    },
    {
      href: `/${locale}/contact-logs`,
      label: t("contactLogs"),
      icon: MessageSquare,
      show: true,
    },
  ];

  const adminItems = [
    {
      href: `/${locale}/agencies`,
      label: t("agencies"),
      icon: Building2,
    },
    {
      href: `/${locale}/offers`,
      label: t("offers"),
      icon: Package,
    },
    {
      href: `/${locale}/destinations`,
      label: t("destinations"),
      icon: MapPin,
    },
    {
      href: `/${locale}/packages`,
      label: t("packages"),
      icon: Globe,
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
    {
      href: `/${locale}/instagram`,
      label: t("instagramImports"),
      icon: Instagram,
    },
    {
      href: `/${locale}/instagram/accounts`,
      label: t("monitoredAccounts"),
      icon: Eye,
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const roleMeta: Record<string, { label: string; color: string }> = {
    SYSTEM_ADMIN: {
      label: "System Admin",
      color:
        "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]",
    },
    TRAVEL_AGENCY_ADMIN: {
      label: "Agency Admin",
      color: "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]",
    },
    TRAVEL_AGENCY_STAFF: {
      label: "Agency Staff",
      color:
        "bg-[hsl(var(--muted-foreground)/0.15)] text-[hsl(var(--muted-foreground))]",
    },
  };
  const role = roleMeta[user?.role ?? ""] ?? {
    label: user?.role ?? "",
    color: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
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
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Admin Portal</p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Section label */}
        <div className="pb-2">
          <p className="px-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            {locale === "ar" ? "القائمة الرئيسية" : "Main Menu"}
          </p>
        </div>

        {mainItems
          .filter((item) => item.show)
          .map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive(item.href, item.exact)
                  ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
              )}
            >
              {isActive(item.href, item.exact) && (
                <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-e-full bg-[hsl(var(--primary-foreground))]" />
              )}
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}

        {isAdmin && (
          <>
            <div className="pt-5 pb-2">
              <div className="flex items-center gap-2 px-3">
                <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" />
                <p className="text-xs font-semibold text-[hsl(var(--destructive))] uppercase tracking-wider">
                  {t("admin")}
                </p>
              </div>
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive(item.href)
                    ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm"
                    : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
                )}
              >
                {isActive(item.href) && (
                  <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-e-full bg-[hsl(var(--primary-foreground))]" />
                )}
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="p-4 border-t border-[hsl(var(--border))] space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-sm font-bold">
              {user.email.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
              <span
                className={cn(
                  "inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
                  role.color
                )}
              >
                {role.label}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.08)] hover:text-[hsl(var(--destructive))] transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t("logout")}
          </button>
        </div>
      )}
    </aside>
  );
}

