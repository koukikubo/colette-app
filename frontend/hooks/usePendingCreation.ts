"use client";
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AuthContext } from "@/features/staff-auth/providers/AuthProvider";
import { ApiClientError } from "@/lib/api/api-client";

const CHANGED = "colette:creation-changed";
const UNAVAILABLE = "!unavailable";
function subscribe(listener: () => void) {
  window.addEventListener(CHANGED, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(CHANGED, listener);
    window.removeEventListener("storage", listener);
  };
}
const serverSnapshot = () => null;
const publish = () => window.dispatchEvent(new Event(CHANGED));

// 入力本文・個人情報を保存せず、同じタブの再読み込みに必要な担当者別キーだけを保持する。
export function usePendingCreation<T>(
  kind: "customers" | "reservations",
  lookup: (key: string) => Promise<T>,
  enabled = true,
) {
  const auth = useContext(AuthContext);
  const staffId = auth?.staff?.id;
  const storageKey =
    enabled && staffId ? `colette:creation:v1:${staffId}:${kind}` : null;
  const snapshot = useCallback(() => {
    if (!storageKey) return null;
    try {
      const value = sessionStorage.getItem(storageKey);
      return value && !/^[a-zA-Z0-9_-]{16,128}$/.test(value)
        ? UNAVAILABLE
        : value;
    } catch {
      return UNAVAILABLE;
    }
  }, [storageKey]);
  const key = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const activeKey = storageKey && key ? `${storageKey}:${key}` : null;
  const ready = Boolean(storageKey) && key !== UNAVAILABLE;
  const payload = useRef<{ identity: string; value: unknown } | null>(null);
  const activeScope = useRef<string | null>(null);
  const [memoryKey, setMemoryKey] = useState<string | null>(null);
  const [sendingKey, setSendingKey] = useState<string | null>(null);
  const [correctionKey, setCorrectionKey] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    identity: string;
    revision: number;
    found?: T;
    missing?: boolean;
    error?: string;
  } | null>(null);
  const uncertain = ready && Boolean(key) && sendingKey !== activeKey;
  const currentResult =
    result?.identity === activeKey && result?.revision === revision
      ? result
      : null;
  const found = currentResult?.found ?? null;
  const checking = uncertain && !currentResult;
  const canRetry = Boolean(activeKey) && memoryKey === activeKey;

  useEffect(() => {
    activeScope.current = storageKey;
    return () => {
      activeScope.current = null;
    };
  }, [storageKey]);
  useEffect(() => {
    if (!uncertain || !key || !activeKey) return;
    let cancelled = false;
    // 再マウント後も自動で書き込まない。外部ストアのキーを使ってGETだけを行う。
    void Promise.resolve()
      .then(() => (cancelled ? undefined : lookup(key)))
      .then(
        (value) => {
          if (!cancelled)
            setResult({ identity: activeKey, revision, found: value });
        },
        (failure) => {
          if (cancelled) return;
          const missing =
            failure instanceof ApiClientError &&
            failure.status === 404 &&
            failure.code === "creation_not_found";
          setResult({
            identity: activeKey,
            revision,
            missing,
            error: missing
              ? undefined
              : "登録結果を確認できませんでした。接続・認証を確認して再取得してください。",
          });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [uncertain, key, activeKey, revision, lookup]);

  function begin<P>(input: P) {
    if (!ready || !storageKey || activeScope.current !== storageKey)
      throw new ApiClientError(
        "担当者情報とブラウザーの保存領域を確認してください",
        409,
        [],
        "recovery_unavailable",
      );
    // 別のフォームや古い描画のイベントから、保持済みの送信キーを上書きしない。
    if (snapshot() !== key)
      throw new ApiClientError(
        "先に前回の登録結果を確認してください",
        409,
        [],
        "pending_creation",
      );
    if (
      uncertain &&
      (checking || found || (!canRetry && !currentResult?.missing))
    )
      throw new ApiClientError(
        "先に前回の登録結果を確認してください",
        409,
        [],
        "pending_creation",
      );
    if (
      uncertain &&
      payload.current?.identity === activeKey &&
      JSON.stringify(payload.current.value) !== JSON.stringify(input) &&
      !(correctionKey === activeKey && currentResult?.missing)
    )
      throw new ApiClientError(
        "前回と入力内容が異なります。前回の内容で再試行してください",
        409,
        [],
        "pending_creation",
      );
    const next = key ?? crypto.randomUUID();
    try {
      sessionStorage.setItem(storageKey, next);
    } catch {
      throw new ApiClientError(
        "送信キーを保持できないため登録を中止しました",
        409,
        [],
        "recovery_unavailable",
      );
    }
    const identity = `${storageKey}:${next}`;
    payload.current = { identity, value: input };
    setMemoryKey(identity);
    setSendingKey(identity);
    setRevision((value) => value + 1);
    publish();
    return next;
  }
  function complete() {
    if (storageKey) {
      try {
        const owned = payload.current?.identity;
        const expected = owned?.startsWith(`${storageKey}:`)
          ? owned.slice(storageKey.length + 1)
          : key;
        if (sessionStorage.getItem(storageKey) === expected)
          sessionStorage.removeItem(storageKey);
      } catch {
        /* 削除できなくても次回のGETで同じ登録済み結果を確認できる。 */
      }
    }
    payload.current = null;
    setMemoryKey(null);
    setCorrectionKey(null);
    setSendingKey(null);
    publish();
  }
  function failed(failure: unknown) {
    // 初回の明確な拒否だけを解除する。既に結果不明なら、その後の4xxでもキーを保持する。
    if (
      !uncertain &&
      failure instanceof ApiClientError &&
      [400, 401, 403, 422].includes(failure.status) &&
      failure.code !== "unexpected_response" &&
      failure.code !== "access_auth_required"
    )
      complete();
    else {
      // 結果確認でも未登録かつ項目エラーが確認できた場合は、同じキーのまま修正を許す。
      // キーは替えないため、遅れて元の要求が到着しても別レコードを作らない。
      if (
        failure instanceof ApiClientError &&
        failure.status === 422 &&
        !Array.isArray(failure.errors) &&
        Object.keys(failure.errors).length > 0
      )
        setCorrectionKey(activeKey);
      setSendingKey(null);
    }
  }
  return {
    ready,
    uncertain,
    canRetry,
    checking,
    missing: Boolean(currentResult?.missing),
    found,
    error:
      key === UNAVAILABLE
        ? "ブラウザーの保存領域を利用できないため、安全に登録できません。設定を確認してください。"
        : (currentResult?.error ?? null),
    begin,
    complete,
    failed,
    previousPayload: <P>() =>
      payload.current?.identity === activeKey
        ? (payload.current.value as P)
        : null,
    check: () => {
      setRevision((value) => value + 1);
      return Promise.resolve();
    },
    isActive: () => Boolean(storageKey) && activeScope.current === storageKey,
  };
}
