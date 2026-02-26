"use client";

import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Menu, Globe, LogOut, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth.store";
import { apiPost } from "@/lib/api";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleLogout() {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await apiPost("/auth/logout", { refreshToken });
      }
    } catch {
      // Ignore logout errors
    }
    clearAuth();
    toast.success(locale === "ar" ? "تم تسجيل الخروج" : "Logged out");
    router.push(`/${locale}/login`);
  }

  function toggleLanguage() {
    const newLocale = locale === "ar" ? "en" : "ar";
    localStorage.setItem("locale", newLocale);
    // Replace locale prefix in pathname
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <header className="flex h-16 items-center gap-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Language toggle */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleLanguage}
        className="gap-2 text-xs"
      >
        <Globe className="h-3.5 w-3.5" />
        {locale === "ar" ? "EN" : "عربي"}
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs">
                {user ? getInitials(user.email) : "??"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {user?.role?.replace(/_/g, " ")}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-[hsl(var(--destructive))] cursor-pointer">
            <LogOut className="me-2 h-4 w-4" />
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
