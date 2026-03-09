"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMonitoredAccount,
  useCreateMonitoredAccount,
  useUpdateMonitoredAccount,
} from "@/hooks/use-instagram-import";
import { useReferenceAgencies } from "@/hooks/use-reference-data";
import { getApiErrorMessage } from "@/lib/api";

interface MonitoredAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string | null;
}

export function MonitoredAccountDialog({
  open,
  onOpenChange,
  accountId,
}: MonitoredAccountDialogProps) {
  const t = useTranslations("instagram");
  const tc = useTranslations("common");
  const isEditing = !!accountId;

  const { agencies } = useReferenceAgencies();
  const { data: existingAccount } = useMonitoredAccount(accountId ?? "");
  const createAccount = useCreateMonitoredAccount();
  const updateAccount = useUpdateMonitoredAccount(accountId ?? "");

  const [username, setUsername] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(30);

  // Reset form when dialog opens or existing data loads
  useEffect(() => {
    if (open && isEditing && existingAccount) {
      setUsername(existingAccount.instagramUsername);
      setAgencyId(existingAccount.travelAgencyId);
      setIsEnabled(existingAccount.isEnabled);
      setPollingInterval(existingAccount.pollingIntervalMinutes);
    } else if (open && !isEditing) {
      setUsername("");
      setAgencyId("");
      setIsEnabled(true);
      setPollingInterval(30);
    }
  }, [open, isEditing, existingAccount]);

  async function handleSubmit() {
    if (!isEditing) {
      if (!username.trim()) {
        toast.error(t("usernameRequired"));
        return;
      }
      if (!agencyId) {
        toast.error(t("agencyRequired"));
        return;
      }
      try {
        await createAccount.mutateAsync({
          travelAgencyId: agencyId,
          instagramUsername: username.trim().replace(/^@/, ""),
          isEnabled,
          pollingIntervalMinutes: pollingInterval,
        });
        toast.success(t("createSuccess"));
        onOpenChange(false);
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      }
    } else {
      try {
        await updateAccount.mutateAsync({
          isEnabled,
          pollingIntervalMinutes: pollingInterval,
        });
        toast.success(t("updateSuccess"));
        onOpenChange(false);
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      }
    }
  }

  const loading = createAccount.isPending || updateAccount.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editAccount") : t("addAccount")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Instagram username — only editable on create */}
          <div>
            <Label>{t("instagramUsername")}</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("instagramUsernamePlaceholder")}
              disabled={isEditing}
              dir="ltr"
            />
          </div>

          {/* Agency — only selectable on create */}
          <div>
            <Label>{t("agency")}</Label>
            <Select value={agencyId} onValueChange={setAgencyId} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectAgency")} />
              </SelectTrigger>
              <SelectContent>
                {agencies.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nameAr || a.nameEn || a.name || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Polling interval */}
          <div>
            <Label>{t("pollingInterval")}</Label>
            <Input
              type="number"
              min={5}
              max={1440}
              value={pollingInterval}
              onChange={(e) => setPollingInterval(Number(e.target.value))}
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              {t("pollingIntervalHint")}
            </p>
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center justify-between">
            <Label>{t("enabled")}</Label>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {isEditing ? tc("save") : tc("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
