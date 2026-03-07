"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Building2, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateOffer } from "@/hooks/use-offers";
import { useAgencies } from "@/hooks/use-agencies";
import { useAuthStore } from "@/store/auth.store";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { OfferFormValues } from "@/components/offers/OfferForm";

const OfferForm = dynamic(() => import("@/components/offers/OfferForm").then(mod => ({ default: mod.OfferForm })), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full" />,
});

export default function NewOfferPage() {
  const t = useTranslations("offers");
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "SYSTEM_ADMIN";
  const isAgencyRole =
    user?.role === "TRAVEL_AGENCY_ADMIN" ||
    user?.role === "TRAVEL_AGENCY_STAFF";
  const myAgencyId = user?.travelAgencyId ?? undefined;

  // For agency users, agency is fixed. For system admin, they pick one.
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>(
    isAgencyRole && myAgencyId ? myAgencyId : ""
  );
  const [agencyPickerOpen, setAgencyPickerOpen] = useState(false);

  const { data: agenciesData, isLoading: agenciesLoading } = useAgencies({
    limit: 100,
  });
  const agencies = agenciesData?.data ?? [];

  const createOffer = useCreateOffer();

  const resolvedAgencyId = isAdmin ? selectedAgencyId : myAgencyId;

  async function handleSubmit(values: OfferFormValues) {
    if (!resolvedAgencyId) {
      toast.error(locale === "ar" ? "اختر وكالة قبل إنشاء العرض" : "Select an agency before creating the offer");
      return;
    }
    try {
      const { hotelIds, destinations, imageUrl, roomOptions, meals, transports, numberOfDays, forceCreate, ...rest } = values as any;
      await createOffer.mutateAsync({
        ...rest,
        ...(numberOfDays !== "" && numberOfDays !== undefined ? { numberOfDays } : {}),
        travelAgencyId: resolvedAgencyId,
        ...(hotelIds && hotelIds.length > 0 ? { hotelIds } : {}),
        ...(destinations && destinations.length > 0 ? { destinations } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        roomOptions: roomOptions.map(({ id, ...opt }: any) => opt),
        ...(meals && meals.length > 0 ? { meals } : {}),
        ...(transports && transports.length > 0 ? { transports } : {}),
        ...(forceCreate ? { forceCreate: true } : {}),
      });
      toast.success(t("created"));
      router.push(`/${locale}/offers`);
    } catch (err) {
      // Re-throw duplicate errors so form component can handle them with dialog
      const errorCode = (err as any)?.response?.data?.error?.code || (err as any)?.response?.data?.code;
      if ((err as any)?.response?.status === 409 && errorCode === "POSSIBLE_DUPLICATE") {
        throw err; // Re-throw so form component catches it and shows dialog
      }
      // Show error toast for other errors
      toast.error(getApiErrorMessage(err));
    }
  }

  async function handleSubmitAndContinue(values: OfferFormValues) {
    if (!resolvedAgencyId) {
      toast.error(locale === "ar" ? "اختر وكالة قبل إنشاء العرض" : "Select an agency before creating the offer");
      return;
    }
    try {
      const { hotelIds, destinations, imageUrl, roomOptions, meals, transports, numberOfDays, forceCreate, ...rest } = values as any;
      await createOffer.mutateAsync({
        ...rest,
        ...(numberOfDays !== "" && numberOfDays !== undefined ? { numberOfDays } : {}),
        travelAgencyId: resolvedAgencyId,
        ...(hotelIds && hotelIds.length > 0 ? { hotelIds } : {}),
        ...(destinations && destinations.length > 0 ? { destinations } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        roomOptions: roomOptions.map(({ id, ...opt }: any) => opt),
        ...(meals && meals.length > 0 ? { meals } : {}),
        ...(transports && transports.length > 0 ? { transports } : {}),
        ...(forceCreate ? { forceCreate: true } : {}),
      });
      toast.success(t("createdAndContinue"));
    } catch (err) {
      // Re-throw duplicate errors so form component can handle them with dialog
      const errorCode = (err as any)?.response?.data?.error?.code || (err as any)?.response?.data?.code;
      if ((err as any)?.response?.status === 409 && errorCode === "POSSIBLE_DUPLICATE") {
        throw err; // Re-throw so form component catches it and shows dialog
      }
      // Show error toast for other errors
      toast.error(getApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/offers`}>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <BackIcon className="h-4 w-4" />
            {locale === "ar" ? "رجوع" : "Back"}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("newOffer")}</h1>
      </div>

      {/* Agency picker — System Admin only */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {locale === "ar" ? "اختر الوكالة" : "Select Agency"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agenciesLoading ? (
              <Skeleton className="h-9 w-64" />
            ) : (
              <Popover open={agencyPickerOpen} onOpenChange={setAgencyPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={agencyPickerOpen}
                    className="w-full max-w-md justify-between"
                  >
                    {selectedAgencyId
                      ? (agencies.find((a) => a.id === selectedAgencyId)?.nameAr ||
                        agencies.find((a) => a.id === selectedAgencyId)?.nameEn ||
                        agencies.find((a) => a.id === selectedAgencyId)?.name)
                      : (locale === "ar" ? "اختر وكالة سفر..." : "Choose a travel agency...")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={locale === "ar" ? "ابحث عن وكالة..." : "Search agencies..."} />
                    <CommandList>
                      <CommandEmpty>
                        {locale === "ar" ? "لا توجد نتائج" : "No agencies found"}
                      </CommandEmpty>
                      <CommandGroup>
                        {agencies.map((a) => {
                          const label = a.nameAr || a.nameEn || a.name;
                          return (
                            <CommandItem
                              key={a.id}
                              value={label}
                              onSelect={() => {
                                setSelectedAgencyId(a.id);
                                setAgencyPickerOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedAgencyId === a.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {label}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </CardContent>
        </Card>
      )}

      {/* Offer form — always visible for admin so image upload/OCR can start early */}
      {(resolvedAgencyId || isAdmin) ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("offerDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <OfferForm
              travelAgencyId={resolvedAgencyId || ""}
              onSubmit={handleSubmit}
              onSubmitAndContinue={handleSubmitAndContinue}
              isLoading={createOffer.isPending}
              submitLabel={t("createOffer")}
              submitAndContinueLabel={t("createAndAddAnother")}
              isSystemAdmin={isAdmin}
              onAgencyDetected={(agencyId) => {
                if (isAdmin) {
                  setSelectedAgencyId(agencyId);
                }
              }}
            />
          </CardContent>
        </Card>
      ) : isAdmin ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))] px-1">
          {locale === "ar"
            ? "اختر وكالة أولاً لعرض نموذج إنشاء العرض."
            : "Select an agency above to continue."}
        </p>
      ) : null}
    </div>
  );
}
