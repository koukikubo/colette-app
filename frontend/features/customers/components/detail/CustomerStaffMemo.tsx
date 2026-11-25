"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
import { ApiClientError } from "@/lib/api/api-client";
import { updateCustomer } from "../../api/customer-api";
import type { Customer } from "../../types";

// 自由記述は構造化された選択回答と分け、既存の顧客更新・競合検知を再利用する。
export function CustomerStaffMemo({
  customer,
  editingDisabled = false,
  onSaved,
  onEditingChange,
}: {
  customer: Customer;
  editingDisabled?: boolean;
  onSaved: (customer: Customer) => void;
  onEditingChange: (value: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function endEdit() {
    setEditing(false);
    onEditingChange(false);
  }
  async function save() {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await updateCustomer(customer.id, {
        customer: { memo: draft || null, lock_version: version },
      });
      onSaved(response.data.customer);
      endEdit();
      setNotice("スタッフメモを保存しました。");
    } catch (cause) {
      setError(
        cause instanceof ApiClientError && cause.status === 409
          ? "別の更新があります。自分の入力を控えたうえで、編集を取り消して最新情報を確認してください。"
          : "保存できませんでした。入力は保持しています。",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section aria-label="スタッフメモ" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">スタッフメモ</h2>
        <PermissionGate resource="customers">
          {!editing && (
            <Button
              variant="outline"
              disabled={editingDisabled}
              onClick={() => {
                setDraft(customer.memo ?? "");
                setVersion(customer.lock_version);
                setEditing(true);
                onEditingChange(true);
                setNotice("");
              }}
            >
              メモを編集
            </Button>
          )}
        </PermissionGate>
      </div>
      {editingDisabled && (
        <p className="text-sm text-muted-foreground">
          詳細情報の編集を保存またはキャンセルすると、メモを編集できます。
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {editing ? (
        <>
          <Textarea
            aria-label="スタッフ共有メモ"
            maxLength={1000}
            rows={8}
            disabled={saving}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => {
                if (window.confirm("入力を破棄しますか？")) {
                  endEdit();
                  setError("");
                }
              }}
            >
              キャンセル
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "保存中…" : "メモを保存"}
            </Button>
          </div>
        </>
      ) : (
        <p className="min-h-24 rounded-xl bg-muted/40 p-4 text-sm leading-7 whitespace-pre-wrap wrap-anywhere">
          {customer.memo || "スタッフメモはありません。"}
        </p>
      )}
    </section>
  );
}
