"use client";

import { useEffect, useState } from "react";
import { SearchIcon, PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/features/staff-auth/components/session/PermissionGate";
import { ApiClientError } from "@/lib/api/api-client";
import {
  fetchCustomerDetailFields,
  updateCustomerDetailFields,
} from "../../api/customer-api";
import type { CustomerDetailFieldsData } from "../../types";

type Props = {
  customerId: number;
  onEditingChange: (editing: boolean) => void;
  onSaved: () => Promise<void>;
};

export function CustomerDetailFields({
  customerId,
  onEditingChange,
  onSaved,
}: Props) {
  const [data, setData] = useState<CustomerDetailFieldsData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<number, number[]>>({});
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");

  useEffect(() => {
    let active = true;
    void fetchCustomerDetailFields(customerId)
      .then((response) => {
        if (active) {
          setData(response.data);
          setError("");
        }
      })
      .catch(() => {
        if (active) setError("詳細情報を取得できませんでした。");
      });
    return () => {
      active = false;
    };
  }, [customerId, reload]);

  // タブ移動ではアンマウントしない。未保存入力は明示的な取消だけで破棄する。
  function changeEditing(next: boolean) {
    setEditing(next);
    onEditingChange(next);
  }
  function beginEditing() {
    if (!data) return;
    setDraft(
      Object.fromEntries(
        data.fields.map((field) => [field.id, [...field.selected_ids]]),
      ),
    );
    setNotice("");
    changeEditing(true);
  }
  async function save() {
    if (!data || saving) return;
    setSaving(true);
    setError("");
    try {
      const changed = data.fields.filter(
        (field) =>
          field.enabled &&
          JSON.stringify(draft[field.id]) !==
            JSON.stringify(field.selected_ids),
      );
      const response = await updateCustomerDetailFields(
        customerId,
        data.lock_version,
        changed.map((field) => ({
          field_id: field.id,
          option_ids: draft[field.id] ?? [],
        })),
      );
      setData(response.data);
      changeEditing(false);
      setNotice("詳細情報を保存しました。");
      // 保存は成功済み。上部情報の再取得失敗で、保存ボタンを再実行させない。
      try {
        await onSaved();
      } catch {
        setNotice("詳細情報は保存済みです。上部情報の再取得に失敗しました。");
      }
    } catch (cause) {
      setError(
        cause instanceof ApiClientError && cause.status === 409
          ? "別の担当者が更新しています。入力を確認してから「最新内容を取得」で再編集してください。"
          : "保存できませんでした。入力は保持しています。最新内容を確認してから再試行してください。",
      );
    } finally {
      setSaving(false);
    }
  }
  function reloadLatest() {
    if (
      editing &&
      !window.confirm("自分の入力を破棄して最新内容を取得しますか？")
    )
      return;
    changeEditing(false);
    setReload((value) => value + 1);
  }
  if (!data)
    return (
      <section className="space-y-3" aria-label="詳細情報">
        {error ? (
          <>
            <p role="alert">{error}</p>
            <Button onClick={reloadLatest}>再読み込み</Button>
          </>
        ) : (
          <p role="status">詳細情報を読み込んでいます…</p>
        )}
      </section>
    );
  const groups = [
    ...new Set(
      data.fields
        .map((field) => field.group)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const fields = data.fields.filter(
    (field) => field.name.includes(query) && (!group || field.group === group),
  );
  return (
    <section className="space-y-6" aria-label="詳細情報" aria-busy={saving}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">詳細情報</h2>
          <p className="text-xs text-muted-foreground">
            店舗で有効にした顧客項目
          </p>
        </div>
        <PermissionGate resource="customers">
          {!editing && data.fields.some((field) => field.enabled) && (
            <Button variant="outline" onClick={beginEditing}>
              <PencilIcon />
              詳細情報を編集
            </Button>
          )}
        </PermissionGate>
      </div>
      {error && (
        <div role="alert" className="space-y-2 text-sm text-destructive">
          <p>{error}</p>
          <Button variant="outline" onClick={reloadLatest} disabled={saving}>
            最新内容を取得
          </Button>
        </div>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
      {data.fields.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-44 flex-1">
            <SearchIcon
              className="absolute top-3 left-3 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="詳細項目を検索"
              placeholder="項目名で探す"
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <select
            aria-label="項目の分類"
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            className="rounded-md border bg-background p-2 text-sm"
          >
            <option value="">すべての分類</option>
            {groups.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </div>
      )}
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => {
          const selected = field.options.filter((option) =>
            field.selected_ids.includes(option.id),
          );
          return (
            <div key={field.id} className="min-w-0 space-y-2">
              <Label htmlFor={`detail-field-${field.id}`}>
                {field.name}
                {!field.enabled && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    無効・保存済み
                  </span>
                )}
              </Label>
              {editing && field.enabled ? (
                field.mode === "multiple" ? (
                  <fieldset disabled={saving} className="flex flex-wrap gap-3">
                    <legend className="sr-only">{field.name}</legend>
                    {field.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={(draft[field.id] ?? []).includes(option.id)}
                          disabled={
                            !option.active &&
                            !field.selected_ids.includes(option.id)
                          }
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              [field.id]: event.target.checked
                                ? [...(current[field.id] ?? []), option.id]
                                : (current[field.id] ?? []).filter(
                                    (id) => id !== option.id,
                                  ),
                            }))
                          }
                        />
                        {option.label}
                        {!option.active && "（無効）"}
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <select
                    id={`detail-field-${field.id}`}
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    disabled={saving}
                    value={draft[field.id]?.[0] ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        [field.id]: event.target.value
                          ? [Number(event.target.value)]
                          : [],
                      }))
                    }
                  >
                    <option value="">未入力</option>
                    {field.options.map((option) => (
                      <option
                        key={option.id}
                        value={option.id}
                        disabled={
                          !option.active &&
                          !field.selected_ids.includes(option.id)
                        }
                      >
                        {option.label}
                        {!option.active && "（無効）"}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <div className="flex min-h-9 flex-wrap gap-2">
                  {selected.length ? (
                    selected.map((option) => (
                      <span
                        key={option.id}
                        className="rounded-md bg-muted px-3 py-1 text-sm wrap-anywhere"
                      >
                        {option.label}
                        {!option.active && "（無効）"}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      未入力
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!fields.length && (
        <p className="py-6 text-sm text-muted-foreground">
          {data.fields.length
            ? "一致する項目はありません。"
            : "顧客詳細の項目は未設定です。基本コードマスタで店舗独自の項目を設定できます。"}
        </p>
      )}
      {editing && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => {
              if (window.confirm("入力を破棄しますか？")) changeEditing(false);
            }}
          >
            キャンセル
          </Button>
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? "保存中…" : "変更を保存"}
          </Button>
        </div>
      )}
    </section>
  );
}
