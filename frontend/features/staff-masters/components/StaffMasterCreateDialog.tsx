"use client";

import { useState } from "react";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { createStaffMaster } from "../api/staff-master-api";
import { STAFF_ROLE_LABELS, STAFF_ROLE_OPTIONS } from "../constants";
import {
  STAFF_ROLE_CODES,
  type CreateStaffMasterRequest,
  type StaffRoleCode,
} from "../types";

type StaffMasterCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
};

type FormValues = {
  name: string;
  role_code: StaffRoleCode;
  employment_started_on: string;
  memo: string;
  password: string;
  password_confirmation: string;
  login_enabled: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  name: "",
  role_code: "operator",
  employment_started_on: "",
  memo: "",
  password: "",
  password_confirmation: "",
  login_enabled: true,
};

export function StaffMasterCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: StaffMasterCreateDialogProps) {
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const resetForm = () => {
    setValues(INITIAL_VALUES);
    setErrors({});
    setApiError(null);
    setConfirmOpen(false);
  };

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForm(values);

    setErrors(nextErrors);
    setApiError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    const payload: CreateStaffMasterRequest = {
      staff_master: {
        name: values.name.trim(),
        role_code: values.role_code,
        employment_started_on: values.employment_started_on,
        memo: values.memo.trim() || null,
      },
      staff: {
        password: values.password,
        password_confirmation: values.password_confirmation,
        login_enabled: values.login_enabled,
      },
    };

    setIsSubmitting(true);
    setApiError(null);

    try {
      await createStaffMaster(payload);
      await onCreated();

      setConfirmOpen(false);
      onOpenChange(false);
      resetForm();
    } catch {
      setConfirmOpen(false);
      setApiError(
        "担当者を登録できませんでした。入力内容を確認して再度お試しください。",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>新規担当者登録</DialogTitle>

            <DialogDescription>
              担当者の基本情報とログイン情報を登録します。
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <div>
                <h3 className="font-medium">担当者基本情報</h3>

                <p className="text-sm text-muted-foreground">
                  業務上使用する担当者情報を入力してください。
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="staff-code" label="担当者コード">
                  <Input
                    id="staff-code"
                    value="登録時に自動採番されます"
                    readOnly
                    tabIndex={-1}
                    className="bg-muted text-muted-foreground"
                  />
                </FormField>

                <FormField
                  id="staff-name"
                  label="担当者名"
                  required
                  error={errors.name}
                >
                  <Input
                    id="staff-name"
                    value={values.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    aria-invalid={Boolean(errors.name)}
                    placeholder="山田 太郎"
                  />
                </FormField>

                <FormField
                  id="staff-role"
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
                      id="staff-role"
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
                  id="employment-started-on"
                  label="入社日"
                  required
                  error={errors.employment_started_on}
                >
                  <Input
                    id="employment-started-on"
                    type="date"
                    value={values.employment_started_on}
                    onChange={(event) =>
                      updateField("employment_started_on", event.target.value)
                    }
                    aria-invalid={Boolean(errors.employment_started_on)}
                  />
                </FormField>
              </div>

              <FormField id="staff-memo" label="メモ" error={errors.memo}>
                <Textarea
                  id="staff-memo"
                  value={values.memo}
                  onChange={(event) => updateField("memo", event.target.value)}
                  placeholder="担当業務や備考を入力"
                  rows={4}
                />
              </FormField>
            </section>

            <Separator />

            <section className="space-y-4">
              <div>
                <h3 className="font-medium">ログイン情報</h3>

                <p className="text-sm text-muted-foreground">
                  初回ログインに使用するパスワードを設定してください。
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="staff-password"
                  label="初期パスワード"
                  required
                  error={errors.password}
                >
                  <Input
                    id="staff-password"
                    type="password"
                    value={values.password}
                    onChange={(event) =>
                      updateField("password", event.target.value)
                    }
                    aria-invalid={Boolean(errors.password)}
                  />
                </FormField>

                <FormField
                  id="staff-password-confirmation"
                  label="パスワード確認"
                  required
                  error={errors.password_confirmation}
                >
                  <Input
                    id="staff-password-confirmation"
                    type="password"
                    value={values.password_confirmation}
                    onChange={(event) =>
                      updateField("password_confirmation", event.target.value)
                    }
                    aria-invalid={Boolean(errors.password_confirmation)}
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="staff-login-enabled">
                    ログインを許可する
                  </Label>

                  <p className="text-sm text-muted-foreground">
                    無効にすると、登録後もログインできません。
                  </p>
                </div>

                <Switch
                  id="staff-login-enabled"
                  checked={values.login_enabled}
                  onCheckedChange={(checked) =>
                    updateField("login_enabled", checked)
                  }
                />
              </div>
            </section>

            {apiError && (
              <p className="text-sm text-destructive" role="alert">
                {apiError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleDialogOpenChange(false)}
              >
                キャンセル
              </Button>

              <Button type="submit" disabled={isSubmitting}>
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
            <AlertDialogTitle>担当者を登録しますか？</AlertDialogTitle>

            <AlertDialogDescription>
              登録内容を確認してください。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className="text-muted-foreground">担当者コード</dt>
            <dd className="font-mono font-medium">登録時に自動採番</dd>

            <dt className="text-muted-foreground">担当者名</dt>
            <dd>{values.name.trim()}</dd>

            <dt className="text-muted-foreground">権限</dt>
            <dd>{STAFF_ROLE_LABELS[values.role_code]}</dd>

            <dt className="text-muted-foreground">入社日</dt>
            <dd>{values.employment_started_on}</dd>

            <dt className="text-muted-foreground">ログイン</dt>
            <dd>{values.login_enabled ? "有効" : "無効"}</dd>

            <dt className="text-muted-foreground">初期パスワード</dt>
            <dd>設定済み</dd>
          </dl>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              修正に戻る
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isSubmitting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmCreate();
              }}
            >
              {isSubmitting && (
                <Loader2Icon className="animate-spin" aria-hidden="true" />
              )}
              登録を確定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

function FormField({
  id,
  label,
  required = false,
  error,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`;

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
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
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

  if (!values.password) {
    errors.password = "初期パスワードを入力してください。";
  }

  if (!values.password_confirmation) {
    errors.password_confirmation = "確認用パスワードを入力してください。";
  } else if (values.password !== values.password_confirmation) {
    errors.password_confirmation = "パスワードが一致していません。";
  }

  return errors;
}

function isStaffRoleCode(value: string): value is StaffRoleCode {
  return STAFF_ROLE_CODES.some((roleCode) => roleCode === value);
}
