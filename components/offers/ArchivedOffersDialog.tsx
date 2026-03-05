"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Archive, ArchiveRestore, Calendar, Building2, MapPin, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Pagination } from "@/components/shared/Pagination";
import { useArchivedOffers, useUnarchiveOffer, useDeleteOffer } from "@/hooks/use-offers";
import { formatDate } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api";
import type { Offer } from "@/types/api";

interface ArchivedOffersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArchivedOffersDialog({ isOpen, onOpenChange }: ArchivedOffersDialogProps) {
  const t = useTranslations("offers");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [page, setPage] = useState(1);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [confirmAction, setConfirmAction] = useState<"delete" | null>(null);

  const { data, isLoading } = useArchivedOffers({
    page,
    limit: 10,
  });

  const { mutate: unarchive, isPending: isUnarchiving } = useUnarchiveOffer();
  const { mutate: deleteOffer, isPending: isDeleting } = useDeleteOffer();

  const totalPages = data?.meta?.totalPages ?? 1;
  const offers = data?.data ?? [];

  const handleUnarchive = (offer: Offer) => {
    unarchive(offer.id, {
      onSuccess: () => {
        toast.success(t("offerRestored"));
        setSelectedOffer(null);
        setConfirmAction(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  const handleDelete = (offer: Offer) => {
    deleteOffer(offer.id, {
      onSuccess: () => {
        toast.success(t("deleteSuccess"));
        setSelectedOffer(null);
        setConfirmAction(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              {t("archivedOffers")}
            </DialogTitle>
            <DialogDescription>
              {t("archivedOffersDescription")}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <EmptyState
              icon={Archive}
              title={t("noArchivedOffers")}
              description={t("noArchivedOffersDescription")}
            />
          ) : (
            <>
              <div className="space-y-3">
                {offers.map((offer) => (
                  <Card key={offer.id} className="hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedOffer(offer)}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {offer.nameAr || offer.nameEn || offer.name || "—"}
                          </h4>
                          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {offer.destinations?.[0]?.destination && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {offer.destinations
                                  .map((d) => d.destination.nameAr || d.destination.nameEn || d.destination.name)
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                            )}
                            {offer.checkInDate && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(offer.checkInDate, locale)}
                              </div>
                            )}
                            {offer.travelAgency && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {offer.travelAgency.name}
                              </div>
                            )}
                          </div>
                          {offer.createdAt && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {t("archivedOn")}: {formatDate(offer.createdAt, locale)}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUnarchive(offer);
                            }}
                            disabled={isUnarchiving}
                          >
                            {isUnarchiving ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <ArchiveRestore className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOffer(offer);
                              setConfirmAction("delete");
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedOffer && confirmAction === "delete"}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOffer(null);
            setConfirmAction(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteOfferTitle")}</DialogTitle>
            <DialogDescription>
              {selectedOffer
                ? t("deleteOfferDescription", {
                    title: selectedOffer.nameAr || selectedOffer.nameEn || selectedOffer.name || "—",
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedOffer(null);
                setConfirmAction(null);
              }}
              disabled={isDeleting}
            >
              {tc("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedOffer && handleDelete(selectedOffer)}
              disabled={isDeleting || !selectedOffer}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tc("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
