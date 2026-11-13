"use client";
import { useRef, useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api/api-client";
import {
  changePassword,
  resetPassword,
  type PasswordInput,
} from "../../api/password-api";
import { useAuth } from "../../hooks/use-auth";

export function PasswordForm({
  target,
  onCompleted,
}: {
  target?: { id: number; lock_version: number; name: string };
  onCompleted?: () => Promise<void>;
}) {
  const auth = useAuth();
  const [values, setValues] = useState<PasswordInput>({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || saved) return;
    if (
      values.password.length < 12 ||
      values.password !== values.password_confirmation
    ) {
      setError("新しいパスワードは12文字以上で、確認用と一致させてください。");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (target) await resetPassword(target.id, target.lock_version, values);
      else await changePassword(values);
      setSaved(true);
      setValues({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      // 保存後の表示更新失敗を、パスワード変更失敗として再送させない。
      if (target) {
        try {
          await onCompleted?.();
        } catch {
          setError("変更済みです。一覧を再取得してください。");
        }
      } else await auth.refreshCurrentStaff().catch(() => undefined);
    } catch (failure) {
      setError(
        failure instanceof ApiClientError
          ? [failure.message, ...failure.errorMessages].join(" ")
          : "変更できませんでした。接続を確認してください。",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (saved)
    return (
      <p role="status">
        パスワードを変更しました。既存のセッションは失効しています。{error}
      </p>
    );
  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
      <p>
        {target
          ? `${target.name}のパスワードを再設定します。実行する管理者の現在のパスワードを入力してください。`
          : "ご自身のパスワードを変更します。変更後は再認証が必要です。"}
      </p>
      {(
        [
          [
            "current_password",
            target ? "管理者の現在のパスワード" : "現在のパスワード",
          ],
          ["password", "新しいパスワード（12文字以上）"],
          ["password_confirmation", "新しいパスワード（確認）"],
        ] as const
      ).map(([key, label]) => (
        <div key={key}>
          <label htmlFor={`pwd-${key}`}>{label}</label>
          <Input
            id={`pwd-${key}`}
            type="password"
            autoComplete={
              key === "current_password" ? "current-password" : "new-password"
            }
            value={values[key]}
            required
            disabled={busy}
            onChange={(e) =>
              setValues((current) => ({ ...current, [key]: e.target.value }))
            }
          />
        </div>
      ))}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <Button disabled={busy} type="submit">
        {busy ? "変更中…" : "パスワードを変更"}
      </Button>
    </form>
  );
}
