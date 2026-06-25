"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Loader2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { updateStaffMaster } from "../api/staff-master-api";
import { STAFF_ROLE_LABELS, STAFF_ROLE_OPTIONS } from "../constants";
import {
  STAFF_ROLE_CODES,
  type StaffMaster,
  type StaffRoleCode,
  type UpdateStaffMasterRequest,
} from "../types";
import { ToggleLoginEnabledDialog } from "./ToggleLoginEnabledDialog";
import { ResetFailedAttemptsDialog } from "./ResetFailedAttemptsDialog";
import { RetireStaffDialog } from "./RetireStaffDialog";
import { useAuth } from "@/features/staff-auth/hooks/use-auth";

type StaffMasterEditDialogProps = {
  open: boolean;
  staffMaster: StaffMaster;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => Promise<void>;
  onRetired: () => Promise<void>;
};

type FormValues = {
  name: string;
  role_code: StaffRoleCode;
  employment_started_on: string;
  memo: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

type ChangeItem = {
  label: string;
  before: string;
  after: string;
};

export function StaffMasterEditDialog({
  open,
  staffMaster,
  onOpenChange,
  onUpdated,
  onRetired,
}: StaffMasterEditDialogProps) {
  const { staff: currentStaff } = useAuth();

  const staff = staffMaster.staff;

  const cannotDisableOwnLogin =
    currentStaff?.id === staff?.id && staff?.login_enabled === true;

  const [values, setValues] = useState<FormValues>(() => ({
    name: staffMaster.name,
    role_code: staffMaster.role_code,
    employment_started_on: staffMaster.employment_started_on,
    memo: staffMaster.memo ?? "",
  }));

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginEnabledDialogOpen, setLoginEnabledDialogOpen] = useState(false);
  const [resetFailedAttemptsDialogOpen, setResetFailedAttemptsDialogOpen] =
    useState(false);
  const [retireDialogOpen, setRetireDialogOpen] = useState(false);

  const changes = useMemo<ChangeItem[]>(() => {
    const items: ChangeItem[] = [];

    const trimmedName = values.name.trim();
    const trimmedMemo = values.memo.trim();

    if (trimmedName !== staffMaster.name) {
      items.push({
        label: "担当者名",
        before: staffMaster.name,
        after: trimmedName,
      });
    }

    if (values.role_code !== staffMaster.role_code) {
      items.push({
        label: "権限",
        before: STAFF_ROLE_LABELS[staffMaster.role_code],
        after: STAFF_ROLE_LABELS[values.role_code],
      });
    }

    if (values.employment_started_on !== staffMaster.employment_started_on) {
      items.push({
        label: "入社日",
        before: formatDate(staffMaster.employment_started_on),
        after: formatDate(values.employment_started_on),
      });
    }

    if (trimmedMemo !== (staffMaster.memo ?? "")) {
      items.push({
        label: "メモ",
        before: staffMaster.memo?.trim() || "未設定",
        after: trimmedMemo || "未設定",
      });
    }

    return items;
  }, [staffMaster, values]);

  const updateField = <K extends keyof FormValues>(
    field: K,
    value: FormValues[K],
  ) => {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));

    setApiError(null);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(values);

    setErrors(nextErrors);
    setApiError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (changes.length === 0) {
      setApiError("変更された項目がありません。");
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    const payload: UpdateStaffMasterRequest = {
      staff_master: {
        name: values.name.trim(),
        role_code: values.role_code,
        employment_started_on: values.employment_started_on,
        memo: values.memo.trim() || null,
      },
    };

    setIsSubmitting(true);
    setApiError(null);

    try {
      await updateStaffMaster(staffMaster.id, payload);
      await onUpdated();

      setConfirmOpen(false);
      onOpenChange(false);
    } catch {
      setConfirmOpen(false);
      setApiError(
        "担当者情報を更新できませんでした。入力内容を確認して再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b px-6 py-5 pr-12">
            <DialogTitle>担当者情報の編集</DialogTitle>

            <DialogDescription>
              {staffMaster.code} {staffMaster.name}
            </DialogDescription>
          </DialogHeader>

          <form
            className="flex min-h-0 flex-1  flex-col "
            onSubmit={handleSubmit}
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section className="space-y-4">
                <div>
                  <h3 className="font-medium">担当者基本情報</h3>

                  <p className="text-sm text-muted-foreground">
                    担当者名、権限、入社日、メモを変更できます。
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField id="edit-staff-code" label="担当者コード">
                    <Input
                      id="edit-staff-code"
                      value={staffMaster.code}
                      readOnly
                      disabled
                      className="font-mono"
                    />
                  </FormField>

                  <FormField
                    id="edit-staff-name"
                    label="担当者名"
                    required
                    error={errors.name}
                  >
                    <Input
                      id="edit-staff-name"
                      value={values.name}
                      onChange={(event) =>
                        updateField("name", event.target.value)
                      }
                      autoComplete="name"
                      aria-invalid={Boolean(errors.name)}
                    />
                  </FormField>

                  <FormField
                    id="edit-staff-role"
                    label="権限"
                    required
                    error={errors.role_code}
                  >
                    <Select
                      value={values.role_code}
                      onValueChange={(value) => {
                        if (isStaffRoleCode(value)) {
                          updateField("role_code", value);
                        }
                      }}
                    >
                      <SelectTrigger
                        id="edit-staff-role"
                        aria-invalid={Boolean(errors.role_code)}
                      >
                        <SelectValue placeholder="権限を選択" />
                      </SelectTrigger>

                      <SelectContent>
                        {STAFF_ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField
                    id="edit-employment-started-on"
                    label="入社日"
                    required
                    error={errors.employment_started_on}
                  >
                    <Input
                      id="edit-employment-started-on"
                      type="date"
                      value={values.employment_started_on}
                      onChange={(event) =>
                        updateField("employment_started_on", event.target.value)
                      }
                      aria-invalid={Boolean(errors.employment_started_on)}
                    />
                  </FormField>
                </div>

                <FormField
                  id="edit-staff-memo"
                  label="メモ"
                  error={errors.memo}
                >
                  <Textarea
                    id="edit-staff-memo"
                    value={values.memo}
                    onChange={(event) =>
                      updateField("memo", event.target.value)
                    }
                    rows={4}
                    placeholder="担当業務や備考を入力"
                  />
                </FormField>
              </section>

              <Separator />

              <section className="space-y-4">
                <div>
                  <h3 className="font-medium">ログイン管理情報</h3>

                  <p className="text-sm text-muted-foreground">
                    ログイン状態とアカウントロック状態を確認できます。
                  </p>
                </div>

                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                  <LoginInfoItem label="ログイン許可">
                    {!staff ? (
                      <Badge variant="outline">未登録</Badge>
                    ) : staff.login_enabled ? (
                      <Badge>有効</Badge>
                    ) : (
                      <Badge variant="secondary">無効</Badge>
                    )}
                  </LoginInfoItem>

                  <LoginInfoItem label="アカウント状態">
                    {!staff ? (
                      <Badge variant="outline">未登録</Badge>
                    ) : staff.locked ? (
                      <Badge variant="destructive">ロック中</Badge>
                    ) : (
                      <Badge variant="outline">正常</Badge>
                    )}
                  </LoginInfoItem>

                  <LoginInfoItem label="ログイン失敗回数">
                    {staff ? `${staff.failed_attempts}回` : "—"}
                  </LoginInfoItem>

                  <LoginInfoItem label="ロック日時">
                    {formatDateTime(staff?.locked_at)}
                  </LoginInfoItem>

                  <LoginInfoItem label="最終ログイン日時">
                    {staff?.last_logged_in_at
                      ? formatDateTime(staff.last_logged_in_at)
                      : "未ログイン"}
                  </LoginInfoItem>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!staff || isSubmitting || cannotDisableOwnLogin}
                      onClick={() => setLoginEnabledDialogOpen(true)}
                    >
                      {staff?.login_enabled
                        ? "ログインを無効にする"
                        : "ログインを有効にする"}
                    </Button>

                    <Button
                      type="button"
                      variant={staff?.locked ? "destructive" : "outline"}
                      disabled={
                        !staff ||
                        isSubmitting ||
                        (!staff.locked && staff.failed_attempts === 0)
                      }
                      onClick={() => setResetFailedAttemptsDialogOpen(true)}
                    >
                      {staff?.locked ? "ロックを解除" : "失敗回数をリセット"}
                    </Button>
                  </div>

                  {cannotDisableOwnLogin && (
                    <p className="text-right text-sm text-muted-foreground">
                      現在ログインしている担当者自身のログインは無効にできません。
                    </p>
                  )}
                </div>
              </section>

              {staffMaster.retired_on === null && (
                <>
                  <Separator />

                  <section className="space-y-4">
                    <div>
                      <h3 className="font-medium">在籍状態</h3>

                      <p className="text-sm text-muted-foreground">
                        退職日を登録して、この担当者を退職済みへ変更します。
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 rounded-lg border border-destructive/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">退職処理</p>

                        <p className="text-sm text-muted-foreground">
                          担当者情報は削除されず、退職者リストへ移動します。
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isSubmitting}
                        onClick={() => setRetireDialogOpen(true)}
                      >
                        退職処理
                      </Button>
                    </div>
                  </section>
                </>
              )}

              {apiError && (
                <p className="text-sm text-destructive" role="alert">
                  {apiError}
                </p>
              )}
            </div>

            <DialogFooter className="shrink-0 border-t bg-background px-8 py-5">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto sm:min-w-28"
                disabled={isSubmitting}
                onClick={() => handleDialogOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button
                className="w-full sm:w-auto sm:min-w-28"
                type="submit"
                disabled={isSubmitting}
              >
                確認へ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(nextOpen) => {
          if (!isSubmitting) {
            setConfirmOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>担当者情報を変更しますか？</AlertDialogTitle>

            <AlertDialogDescription>
              以下の変更内容を確認してください。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
              <span className="font-mono">{staffMaster.code}</span>
              <span className="ml-2">{staffMaster.name}</span>
            </div>

            <div className="space-y-3">
              {changes.map((change) => (
                <div
                  key={change.label}
                  className="rounded-md border p-3 text-sm"
                >
                  <p className="font-medium">{change.label}</p>

                  <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <span className="text-muted-foreground">
                      {change.before}
                    </span>

                    <span aria-hidden="true">→</span>

                    <span>{change.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              修正に戻る
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isSubmitting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmUpdate();
              }}
            >
              {isSubmitting && (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              )}
              変更を確定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ToggleLoginEnabledDialog
        open={loginEnabledDialogOpen}
        staffMaster={staffMaster}
        onOpenChange={setLoginEnabledDialogOpen}
        onUpdated={onUpdated}
      />

      <ResetFailedAttemptsDialog
        open={resetFailedAttemptsDialogOpen}
        staffMaster={staffMaster}
        onOpenChange={setResetFailedAttemptsDialogOpen}
        onUpdated={onUpdated}
      />

      <RetireStaffDialog
        open={retireDialogOpen}
        staffMaster={staffMaster}
        onOpenChange={setRetireDialogOpen}
        onRetired={onRetired}
      />
    </>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

function FormField({
  id,
  label,
  required = false,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}

        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {children}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function LoginInfoItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>

      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "担当者名を入力してください。";
  }

  if (!isStaffRoleCode(values.role_code)) {
    errors.role_code = "権限を選択してください。";
  }

  if (!values.employment_started_on) {
    errors.employment_started_on = "入社日を入力してください。";
  }

  return errors;
}

function isStaffRoleCode(value: string): value is StaffRoleCode {
  return STAFF_ROLE_CODES.some((roleCode) => roleCode === value);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
