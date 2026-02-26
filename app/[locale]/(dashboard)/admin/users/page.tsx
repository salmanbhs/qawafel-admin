"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, UserCheck, UserX, KeyRound, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAdminUsers, useActivateUser, useDeactivateUser, useResetPassword } from "@/hooks/use-admin";
import { getApiErrorMessage } from "@/lib/api";
import { getInitials } from "@/lib/utils";

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params.locale;

  const { data, isLoading } = useAdminUsers();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetPassword();

  const users = data?.data || [];

  const handleActivate = async (id: string) => {
    try {
      await activateUser.mutateAsync(id);
      toast.success(t("userActivated"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateUser.mutateAsync(id);
      toast.success(t("userDeactivated"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      await resetPassword.mutateAsync(id);
      toast.success(t("passwordResetSent"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">{t("users")}</h1>
          <Link href={`/${locale}/admin/users/new`}>
            <Button><Plus className="me-2 h-4 w-4" />{t("newUser")}</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Shield}
            title={t("noUsers")}
            action={
              <Link href={`/${locale}/admin/users/new`}>
                <Button><Plus className="me-2 h-4 w-4" />{t("newUser")}</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {getInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{user.email}</p>
                        <Badge
                          variant={
                            user.role === "SYSTEM_ADMIN"
                              ? "destructive"
                              : user.role === "AGENCY_ADMIN"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {user.role}
                        </Badge>
                        <Badge
                          variant={user.isActive ? "success" : "secondary"}
                          className="text-xs"
                        >
                          {user.isActive ? tc("active") : tc("inactive")}
                        </Badge>
                      </div>
                      {user.travelAgencyId && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("agencyId")}: {user.travelAgencyId}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">{tc("actions")}</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.isActive ? (
                          <ConfirmDialog
                            title={t("deactivateUser")}
                            description={t("deactivateUserConfirm")}
                            onConfirm={() => handleDeactivate(user.id)}
                            isLoading={deactivateUser.isPending}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                <UserX className="me-2 h-4 w-4" />{t("deactivate")}
                              </DropdownMenuItem>
                            }
                          />
                        ) : (
                          <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                            <UserCheck className="me-2 h-4 w-4" />{t("activate")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <ConfirmDialog
                          title={t("resetPassword")}
                          description={t("resetPasswordConfirm")}
                          onConfirm={() => handleResetPassword(user.id)}
                          isLoading={resetPassword.isPending}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <KeyRound className="me-2 h-4 w-4" />{t("resetPassword")}
                            </DropdownMenuItem>
                          }
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
