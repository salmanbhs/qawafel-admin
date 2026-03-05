"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2, X, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useUploadPackageIcon, useUploadPackageBanner } from "@/hooks/use-packages";
import { getApiErrorMessage } from "@/lib/api";
import type { Package } from "@/types/api";

const schema = z
  .object({
    nameAr: z.string().max(255).optional(),
    nameEn: z.string().max(255).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
    isFeatured: z.boolean(),
    iconImageUrl: z.string().optional(),
    bannerImageUrl: z.string().optional(),
  })
  .refine((d) => d.nameAr || d.nameEn, {
    message: "At least one name is required",
    path: ["nameAr"],
  });

export type PackageFormValues = z.infer<typeof schema>;

interface PackageFormProps {
  defaultValues?: Partial<Package>;
  onSubmit: (values: PackageFormValues) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  packageId?: string;
}

export function PackageForm({ defaultValues, onSubmit, isLoading, submitLabel, packageId }: PackageFormProps) {
  const t = useTranslations("packages");
  const tc = useTranslations("common");

  const [iconPreview, setIconPreview] = useState<string | null>(defaultValues?.iconImageUrl || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(defaultValues?.bannerImageUrl || null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const uploadIcon = useUploadPackageIcon(packageId || "");
  const uploadBanner = useUploadPackageBanner(packageId || "");

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      nameAr: defaultValues?.nameAr || "",
      nameEn: defaultValues?.nameEn || "",
      status: defaultValues?.status || "ACTIVE",
      isFeatured: defaultValues?.isFeatured ?? false,
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
                <FormControl><Input dir="rtl" placeholder="عمرة كاملة" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </TabsContent>

          <TabsContent value="en" className="space-y-4 mt-4">
            <FormField control={form.control} name="nameEn" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameEn")}</FormLabel>
                <FormControl><Input dir="ltr" placeholder="Umrah Full Package" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Status */}
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel>{t("status")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">{t("statusActive")}</SelectItem>
                  <SelectItem value="INACTIVE">{t("statusInactive")}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          {/* isFeatured */}
          <FormField control={form.control} name="isFeatured" render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-4 self-end">
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="cursor-pointer">{t("isFeatured")}</FormLabel>
            </FormItem>
          )} />
        </div>

        {/* Icon and Banner Upload - Only show when editing */}
        {packageId && (
        <div className="space-y-6 pt-4 border-t">
          <div>
            <h3 className="font-semibold mb-4">{t("images")}</h3>

            {/* Icon Upload */}
              <div className="space-y-2 mb-6">
                <FormLabel>{t("packageIcon")}</FormLabel>
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
                <FormLabel>{t("packageBanner")}</FormLabel>
                <p className="text-xs text-muted-foreground">{t("maxSize")} 5MB · {t("formats")} JPEG, PNG, WebP, GIF</p>

                {bannerPreview && (
                  <div
                    onClick={() => !uploadBanner.isPending && bannerInputRef.current?.click()}
                    className="relative w-full h-40 rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors group"
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
