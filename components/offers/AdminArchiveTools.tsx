"use client";

import { useTranslations } from "next-intl";
import { Archive, Loader2, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAutoArchivePastOffers, useDeleteOldArchivedOffers, useCleanupOrphanedFiles } from "@/hooks/use-offers";
import { getApiErrorMessage } from "@/lib/api";
import { Input } from "@/components/ui/input";

interface AdminArchiveToolsProps {
  onArchivedClick?: () => void;
}

export function AdminArchiveTools({ onArchivedClick }: AdminArchiveToolsProps) {
  const t = useTranslations("offers");
  const tc = useTranslations("common");

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [daysOld, setDaysOld] = useState("90");
  const [hoursOld, setHoursOld] = useState("24");

  const { mutate: autoArchive, isPending: isAutoArchiving } = useAutoArchivePastOffers();
  const { mutate: deleteOld, isPending: isDeletingOld } = useDeleteOldArchivedOffers();
  const { mutate: cleanupOrphaned, isPending: isCleaningUp } = useCleanupOrphanedFiles();

  const handleAutoArchive = () => {
    autoArchive(undefined, {
      onSuccess: (data) => {
        toast.success(
          t("autoArchiveSuccess", { count: data.archived })
        );
        setConfirmArchive(false);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  const handleDeleteOld = () => {
    const days = parseInt(daysOld) || 90;
    deleteOld(days, {
      onSuccess: (data) => {
        toast.success(
          t("deleteOldSuccess", { count: data.deletedOffers, days })
        );
        setConfirmDelete(false);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  const handleCleanupOrphaned = () => {
    const hours = parseInt(hoursOld) || 24;
    cleanupOrphaned(hours, {
      onSuccess: (data: any) => {
        toast.success(
          t("cleanupOrphanedSuccess", { count: data?.deletedFiles || 0, hours })
        );
        setConfirmCleanup(false);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };



  return (
    <>
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Archive className="h-4 w-4" />
            {t("archiveManagement")}
          </CardTitle>
          <CardDescription>
            {t("archiveManagementDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={onArchivedClick}
              variant="outline"
              className="justify-start"
            >
              <Archive className="mr-2 h-4 w-4" />
              {t("viewArchived")}
            </Button>

            <Button
              onClick={() => setConfirmArchive(true)}
              disabled={isAutoArchiving}
              variant="outline"
              className="justify-start"
            >
              {isAutoArchiving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tc("processing")}
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  {t("autoArchivePast")}
                </>
              )}
            </Button>

            <Button
              onClick={() => setConfirmDelete(true)}
              disabled={isDeletingOld}
              variant="outline"
              className="justify-start"
            >
              {isDeletingOld ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tc("processing")}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteOldArchived")}
                </>
              )}
            </Button>

            <Button
              onClick={() => setConfirmCleanup(true)}
              disabled={isCleaningUp}
              variant="outline"
              className="justify-start"
            >
              {isCleaningUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tc("processing")}
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("cleanupOrphaned")}
                </>
              )}
            </Button>

          </div>
        </CardContent>
      </Card>

      {/* Auto-Archive Confirmation Dialog */}
      <Dialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("autoArchiveTitle")}</DialogTitle>
            <DialogDescription>{t("autoArchiveDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmArchive(false)}
              disabled={isAutoArchiving}
            >
              {tc("cancel")}
            </Button>
            <Button
              onClick={handleAutoArchive}
              disabled={isAutoArchiving}
            >
              {isAutoArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("archive")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Old Archived Offers Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteOldTitle")}</DialogTitle>
            <DialogDescription>{t("deleteOldDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("daysOldLabel")}</label>
              <Input
                type="number"
                min="1"
                max="365"
                value={daysOld}
                onChange={(e) => setDaysOld(e.target.value)}
                disabled={isDeletingOld}
                className="mt-2"
                placeholder="90"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("daysOldHint")}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeletingOld}
            >
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOld}
              disabled={isDeletingOld}
            >
              {isDeletingOld && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cleanup Orphaned Files Dialog */}
      <Dialog open={confirmCleanup} onOpenChange={setConfirmCleanup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cleanupOrphanedTitle")}</DialogTitle>
            <DialogDescription>{t("cleanupOrphanedDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t("hoursOldLabel")}</label>
              <Input
                type="number"
                min="1"
                max="168"
                value={hoursOld}
                onChange={(e) => setHoursOld(e.target.value)}
                disabled={isCleaningUp}
                className="mt-2"
                placeholder="24"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("hoursOldHint")}</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setConfirmCleanup(false)}
              disabled={isCleaningUp}
            >
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCleanupOrphaned}
              disabled={isCleaningUp}
            >
              {isCleaningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc("delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
