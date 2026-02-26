"use client";

import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Mail, Phone, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useContactLog } from "@/hooks/use-contact-logs";
import { formatDate } from "@/lib/utils";

export default function ContactLogDetailPage() {
  const t = useTranslations("contactLogs");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams<{ locale: string; id: string }>();
  const { locale, id } = params;

  const { data: log, isLoading } = useContactLog(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!log) {
    return (
      <EmptyState
        title={t("notFound")}
        action={<Button variant="outline" onClick={() => router.back()}>{tc("back")}</Button>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-2xl font-bold">{t("inquiry")}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
            <CardTitle>{t("message")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{log.message}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t("senderInfo")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{tc("status")}</span>
              <StatusBadge status={log.status} />
            </div>
            {log.senderName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("senderName")}</span>
                <span className="text-sm">{log.senderName}</span>
              </div>
            )}
            {log.senderEmail && (
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
                  <Mail className="h-3.5 w-3.5" />{t("senderEmail")}
                </span>
                <a href={`mailto:${log.senderEmail}`} className="text-sm text-primary hover:underline break-all">
                  {log.senderEmail}
                </a>
              </div>
            )}
            {log.senderPhone && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />{t("senderPhone")}
                </span>
                <a href={`tel:${log.senderPhone}`} className="text-sm text-primary hover:underline">
                  {log.senderPhone}
                </a>
              </div>
            )}
            {log.offerId && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t("offerId")}</span>
                <span className="text-xs text-muted-foreground font-mono">{log.offerId}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{tc("createdAt")}</span>
              <span className="text-sm">{formatDate(log.createdAt, locale)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
