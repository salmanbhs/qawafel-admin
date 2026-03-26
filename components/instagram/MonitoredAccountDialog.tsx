"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Check, ChevronsUpDown, RefreshCw } from "lucide-react";
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
import { cn } from "@/lib/utils";
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

  const { agencies, refresh: refreshAgencies, cooldownKey, isFetching: agenciesFetching } = useReferenceAgencies();
  const [agencyCooldown, setAgencyCooldown] = useState(0); // seconds remaining
  const { data: existingAccount } = useMonitoredAccount(accountId ?? "");
  const createAccount = useCreateMonitoredAccount();
  const updateAccount = useUpdateMonitoredAccount(accountId ?? "");

  const [username, setUsername] = useState("");
  const [agencyId, setAgencyId] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(30);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Initialise cooldown from localStorage when dialog opens
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(cooldownKey);
      if (raw) {
        const elapsed = Date.now() - (JSON.parse(raw) as number);
        const remaining = Math.max(0, 5 * 60 * 1000 - elapsed);
        setAgencyCooldown(Math.ceil(remaining / 1000));
      } else {
        setAgencyCooldown(0);
      }
    } catch {
      setAgencyCooldown(0);
    }
  }, [open, cooldownKey]);

  // Countdown tick
  useEffect(() => {
    if (agencyCooldown <= 0) return;
    const id = setInterval(() => setAgencyCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [agencyCooldown > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRefreshAgencies() {
    const remaining = refreshAgencies();
    if (remaining > 0) {
      setAgencyCooldown(Math.ceil(remaining / 1000));
    } else {
      setAgencyCooldown(5 * 60); // 5-minute cooldown starts now
    }
  }

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
            <div className="flex items-center justify-between mb-1">
              <Label>{t("agency")}</Label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleRefreshAgencies}
                  disabled={agencyCooldown > 0 || agenciesFetching}
                  className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title={agencyCooldown > 0 ? `Wait ${agencyCooldown}s` : "Refresh agency list"}
                >
                  <RefreshCw className={`h-3 w-3 ${agenciesFetching ? "animate-spin" : ""}`} />
                  {agencyCooldown > 0 ? `${agencyCooldown}s` : "Refresh"}
                </button>
              )}
            </div>
            <Popover open={popoverOpen && !isEditing} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  disabled={isEditing}
                  className="w-full justify-between"
                >
                  {agencyId
                    ? agencies.find((a) => a.id === agencyId)?.nameAr ||
                      agencies.find((a) => a.id === agencyId)?.nameEn ||
                      agencies.find((a) => a.id === agencyId)?.name
                    : t("selectAgency")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder={tc("search")} />
                  <CommandEmpty>{tc("noResults")}</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {agencies.map((agency) => (
                        <CommandItem
                          key={agency.id}
                          value={agency.id}
                          onSelect={(currentValue) => {
                            setAgencyId(currentValue === agencyId ? "" : currentValue);
                            setPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              agencyId === agency.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {agency.nameAr || agency.nameEn || agency.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
