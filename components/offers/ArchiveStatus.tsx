"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Offer } from "@/types/api";

interface ArchiveStatusProps {
  offer: Offer;
  onArchive?: () => void;
  onUnarchive?: () => void;
  isLoading?: boolean;
  isAdmin?: boolean;
}

export function ArchiveStatus({
  offer,
  onArchive,
  onUnarchive,
  isLoading = false,
  isAdmin = false,
}: ArchiveStatusProps) {
  const t = useTranslations("offers");
  const tc = useTranslations("common");

  const isArchived = offer.status === "ARCHIVED";

  return (
    <div className="flex items-center gap-3">
      {isArchived && (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <Archive className="mr-1.5 h-3 w-3" />
          {t("archived")}
        </Badge>
      )}

      {isAdmin && (
        <div className="flex gap-2">
          {!isArchived ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onArchive}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  {tc("archiving")}
                </>
              ) : (
                <>
                  <Archive className="mr-1.5 h-3 w-3" />
                  {t("archive")}
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onUnarchive}
              disabled={isLoading}
              className="text-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  {tc("restoring")}
                </>
              ) : (
                <>
                  <ArchiveRestore className="mr-1.5 h-3 w-3" />
                  {t("restore")}
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
