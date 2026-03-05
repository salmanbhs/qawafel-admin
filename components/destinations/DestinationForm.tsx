"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUploadDestinationIcon, useUploadDestinationBanner } from "@/hooks/use-destinations";
import { usePackages } from "@/hooks/use-packages";
import { getApiErrorMessage } from "@/lib/api";
import type { Destination } from "@/types/api";

const schema = z
  .object({
    nameAr: z.string().max(255).optional(),
    nameEn: z.string().max(255).optional(),
    region: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    status: z.enum(["PENDING", "ACTIVE", "ARCHIVED"]).optional(),
    packageIds: z.array(z.string()).optional(),
    iconImageUrl: z.string().optional(),
    bannerImageUrl: z.string().optional(),
  })
  .refine((d) => d.nameAr || d.nameEn, {
    message: "At least one name is required",
    path: ["nameAr"],
  });

export type DestinationFormValues = z.infer<typeof schema>;

interface DestinationFormProps {
  defaultValues?: Partial<Destination>;
  onSubmit: (values: DestinationFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  destinationId?: string;
}

export function DestinationForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel,
  destinationId,
}: DestinationFormProps) {
  const t = useTranslations("destinations");
  const tc = useTranslations("common");

  const [iconPreview, setIconPreview] = useState<string | null>(defaultValues?.iconImageUrl || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(defaultValues?.bannerImageUrl || null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const uploadIcon = useUploadDestinationIcon(destinationId || "");
  const uploadBanner = useUploadDestinationBanner(destinationId || "");
  const { data: packagesData } = usePackages({ limit: 100 });
  const packages = packagesData?.data ?? [];

  const form = useForm<DestinationFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nameAr: defaultValues?.nameAr || "",
      nameEn: defaultValues?.nameEn || "",
      region: defaultValues?.region || "",
      city: defaultValues?.city || "",
      latitude: defaultValues?.latitude ?? undefined,
      longitude: defaultValues?.longitude ?? undefined,
      status: defaultValues?.status || "ACTIVE",
      packageIds: (defaultValues as any)?.packages?.map((p: any) => p.packageId) || [],
      iconImageUrl: defaultValues?.iconImageUrl || "",
      bannerImageUrl: defaultValues?.bannerImageUrl || "",
    },
  });

  const handleIconUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error(tc("invalidFileType"));
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await uploadIcon.mutateAsync(formData);
      const iconUrl = response.iconImageUrl;
      if (iconUrl) {
        form.setValue("iconImageUrl", iconUrl);
        setIconPreview(iconUrl);
      }
      toast.success(t("iconUploaded"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleBannerUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error(tc("invalidFileType"));
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await uploadBanner.mutateAsync(formData);
      const bannerUrl = response.bannerImageUrl;
      if (bannerUrl) {
        form.setValue("bannerImageUrl", bannerUrl);
        setBannerPreview(bannerUrl);
      }
      toast.success(t("bannerUploaded"));
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="ar">
          <TabsList>
            <TabsTrigger value="ar">{tc("arabic")}</TabsTrigger>
            <TabsTrigger value="en">{tc("english")}</TabsTrigger>
          </TabsList>

          <TabsContent value="ar" className="space-y-4 mt-4">
            <FormField control={form.control} name="nameAr" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameAr")}</FormLabel>
                <FormControl><Input dir="rtl" placeholder="المالديف" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </TabsContent>

          <TabsContent value="en" className="space-y-4 mt-4">
            <FormField control={form.control} name="nameEn" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameEn")}</FormLabel>
                <FormControl><Input dir="ltr" placeholder="Maldives" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField control={form.control} name="region" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("region")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("city")}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="latitude" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("latitude")}</FormLabel>
              <FormControl><Input type="number" step="any" dir="ltr" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="longitude" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("longitude")}</FormLabel>
              <FormControl><Input type="number" step="any" dir="ltr" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {/* Status */}
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem className="max-w-xs">
            <FormLabel>{t("status")}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {["PENDING", "ACTIVE", "ARCHIVED"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {/* Linked Packages */}
        {packages.length > 0 && (
          <div className="pt-2">
            <FormLabel className="text-base font-semibold mb-3 block">{t("linkedPackages")}</FormLabel>
            <div className="space-y-2">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`pkg-${pkg.id}`}
                    checked={form.watch("packageIds")?.includes(pkg.id) ?? false}
                    onChange={(e) => {
                      const current = form.watch("packageIds") || [];
                      if (e.target.checked) {
                        form.setValue("packageIds", [...current, pkg.id]);
                      } else {
                        form.setValue("packageIds", current.filter((id) => id !== pkg.id));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`pkg-${pkg.id}`} className="text-sm font-medium cursor-pointer">
                    {pkg.nameAr || pkg.nameEn || pkg.name || "—"}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Icon and Banner Upload - Only show when editing */}
        {destinationId && (
        <div className="space-y-6 pt-4 border-t">
          <div>
            <h3 className="font-semibold mb-4">{t("images")}</h3>

            {/* Icon Upload */}
            <div className="space-y-2 mb-6">
              <FormLabel>{t("destinationIcon")}</FormLabel>
              <p className="text-xs text-muted-foreground">{t("maxSize")} 5MB · {t("formats")} JPEG, PNG, WebP, GIF</p>

              {iconPreview && (
                <div
                  onClick={() => !uploadIcon.isPending && iconInputRef.current?.click()}
                  className="relative w-32 h-32 rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors group"
                  title={uploadIcon.isPending ? "Uploading..." : "Click to replace image"}
                >
                  <img src={iconPreview} alt="Icon preview" className="w-full h-full object-contain p-2" />
                  
                  {uploadIcon.isPending && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIconPreview(null);
                      form.setValue("iconImageUrl", "");
                    }}
                    disabled={uploadIcon.isPending}
                    className="absolute -top-2 -end-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-full p-2 transition-colors shadow-lg hover:shadow-xl z-10 group-hover:scale-110 duration-200"
                    title="Remove image"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {!iconPreview && (
                <div
                  onClick={() => iconInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 p-6 cursor-pointer transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">{t("uploadIcon")}</p>
                  <p className="text-xs text-muted-foreground">{t("orClickToUpload")}</p>
                </div>
              )}

              <input
                ref={iconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleIconUpload(e.target.files)}
                disabled={uploadIcon.isPending}
              />
            </div>

            {/* Banner Upload */}
            <div className="space-y-2">
              <FormLabel>{t("destinationBanner")}</FormLabel>
              <p className="text-xs text-muted-foreground">{t("maxSize")} 5MB · {t("formats")} JPEG, PNG, WebP, GIF</p>

              {bannerPreview && (
                <div
                  onClick={() => !uploadBanner.isPending && bannerInputRef.current?.click()}
                  className="relative w-full h-48 rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors group"
                  title={uploadBanner.isPending ? "Uploading..." : "Click to replace image"}
                >
                  <img src={bannerPreview} alt="Banner preview" className="w-full h-full object-cover" />
                  
                  {uploadBanner.isPending && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBannerPreview(null);
                      form.setValue("bannerImageUrl", "");
                    }}
                    disabled={uploadBanner.isPending}
                    className="absolute -top-2 -end-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-full p-2 transition-colors shadow-lg hover:shadow-xl z-10 group-hover:scale-110 duration-200"
                    title="Remove image"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}

              {!bannerPreview && (
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 p-6 cursor-pointer transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm font-medium">{t("uploadBanner")}</p>
                  <p className="text-xs text-muted-foreground">{t("orClickToUpload")}</p>
                </div>
              )}

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleBannerUpload(e.target.files)}
                disabled={uploadBanner.isPending}
              />
            </div>
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {submitLabel || tc("save")}
        </Button>
      </form>
    </Form>
  );
}
