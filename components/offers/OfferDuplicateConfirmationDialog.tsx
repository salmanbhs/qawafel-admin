"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { AlertCircle, Loader2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface DuplicateOfferData {
  duplicateOfferId: string;
  duplicateSummary: {
    checkInDate: string;
    checkOutDate: string;
    numberOfDays: number;
    status: string;
  };
}

interface OfferDuplicateConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateData: DuplicateOfferData | null;
  onCreateAnywayClick: () => void;
  isLoading?: boolean;
}

export function OfferDuplicateConfirmationDialog({
  open,
  onOpenChange,
  duplicateData,
  onCreateAnywayClick,
  isLoading = false,
}: OfferDuplicateConfirmationDialogProps) {
  const t = useTranslations("offers");
  const tc = useTranslations("common");

  if (!duplicateData) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    ARCHIVED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    APPROVED:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  const statusColor =
    statusColors[duplicateData.duplicateSummary.status] ||
    "bg-gray-100 text-gray-800";
  const duplicateStatus = duplicateData.duplicateSummary.status;
  const duplicateStatusLabel = t.has(`status_${duplicateStatus}`)
    ? t(`status_${duplicateStatus}`)
    : duplicateStatus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <DialogTitle>
              {t("duplicateDetected") || "Duplicate Offer Detected"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {t("duplicateDetectedDescription") ||
              "An offer with the same core data already exists. Please review the details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing Offer Info */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <h4 className="font-medium text-sm">
              {t("existingOfferDetails") || "Existing Offer"}
            </h4>

            {/* Offer ID with Link */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("offerId") || "Offer ID"}
              </p>
              <Link href={`/offers/${duplicateData.duplicateOfferId}`}>
                <Button variant="link" className="h-auto p-0 text-sm">
                  {duplicateData.duplicateOfferId}
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("duplicateCheckInDate") || "Check-in Date"}
                </p>
                <p className="text-sm font-medium">
                  {formatDate(duplicateData.duplicateSummary.checkInDate)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("duplicateCheckOutDate") || "Check-out Date"}
                </p>
                <p className="text-sm font-medium">
                  {formatDate(duplicateData.duplicateSummary.checkOutDate)}
                </p>
              </div>
            </div>

            {/* Duration & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("numberOfDays") || "Duration"}
                </p>
                <p className="text-sm font-medium">
                  {duplicateData.duplicateSummary.numberOfDays}{" "}
                  {t("days") || "days"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("status") || "Status"}
                </p>
                <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${statusColor}`}>
                  {duplicateStatusLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Info About Duplicate Check */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 space-y-2">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-amber-900 dark:text-amber-100">
                  {t("duplicateCheckBasis") || "Duplicate Detected Based On:"}
                </p>
                <ul className="text-xs space-y-1 ml-4 list-disc text-amber-800 dark:text-amber-200 mt-2">
                  <li>{t("duplicateDates") || "Check-in and check-out dates"}</li>
                  <li>{t("duplicateDestinations") || "Destinations"}</li>
                  <li>{t("duplicateHotels") || "Hotels"}</li>
                  <li>{t("roomTypes") || "Room types and prices"}</li>
                  <li>{t("duplicateTransports") || "Transportation details"}</li>
                </ul>
                <p className="text-xs mt-2 italic text-amber-700 dark:text-amber-300">
                  {t("notChecked") ||
                    "Note: Offer names, descriptions, and images are NOT compared."}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tc("cancel") || "Cancel"}
            </Button>
            <Button
              onClick={onCreateAnywayClick}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("createAnyway") || "Create Anyway"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
