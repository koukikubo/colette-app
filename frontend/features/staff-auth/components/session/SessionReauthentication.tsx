"use client";
import { useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginStaff } from "../../api/staff-auth-api";
import { ApiClientError } from "@/lib/api/api-client";
import type { Staff } from "../../types";

// 画面を遷移・破棄せず、同一担当者の再認証後に元の入力へ戻す。
export function SessionReauthentication({
  staff,
  resume,
  logout,
}: {
  staff: Staff;
  resume: () => Promise<void>;
  logout: () => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await loginStaff({ staff: { staff_id: staff.id, password } });
      setPassword("");
      await resume();
    } catch (failure) {
      setError(
        failure instanceof ApiClientError
          ? failure.message
          : "再認証できませんでした。接続を確認して再試行してください。",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>セッションの再認証</DialogTitle>
          <DialogDescription>
            入力内容と現在の画面を保持しています。{staff.staff_master.name}
            として再認証してください。保存操作は自動再送しません。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label htmlFor="reauth-password">パスワード</label>
          <Input
            id="reauth-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={busy}
          />
          {error && <p role="alert">{error}</p>}
          <Button disabled={busy} type="submit">
            {busy ? "確認中…" : "再認証して戻る"}
          </Button>
        </form>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => {
            if (window.confirm("入力内容を破棄してログアウトしますか？"))
              void logout().catch(() =>
                setError("ログアウトできませんでした。再試行してください。"),
              );
          }}
        >
          入力を破棄してログアウト
        </Button>
      </DialogContent>
    </Dialog>
  );
}
