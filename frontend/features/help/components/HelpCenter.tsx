"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthContext } from "@/features/staff-auth/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchGuideState,
  saveGuideState,
  type GuideState,
} from "../api/guide-state-api";
import { guideForPath, guidesForRole, overviewSteps } from "../guide-catalog";
import { OPEN_HELP_EVENT } from "./HelpButton";
import { GuideSpotlight } from "./GuideSpotlight";

type Preference = {
  state: GuideState | null;
  error: string | null;
  saving: boolean;
  save: (outcome: "completed" | "skipped") => Promise<boolean>;
  retry: () => void;
};

// 担当者切替ではコンポーネントごと破棄し、他人の完了状態を引き継がない。
export function HelpCenter() {
  const auth = useContext(AuthContext);
  const pathname = usePathname();
  if (auth?.status === "authenticated" && auth.staff)
    return (
      <GuideSession
        key={auth.staff.id}
        role={auth.staff.staff_master.role_code}
        pathname={pathname}
      />
    );
  if (pathname === "/login")
    return <HelpSurface key="public" pathname={pathname} />;
  return null;
}

function GuideSession({ role, pathname }: { role: string; pathname: string }) {
  const [state, setState] = useState<GuideState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const mounted = useRef(true);
  const revision = useRef(0);
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    const requestedRevision = revision.current;
    void fetchGuideState(controller.signal)
      .then((response) => {
        if (
          !controller.signal.aborted &&
          requestedRevision === revision.current
        ) {
          setState(response.data.guide_state);
          setError(null);
        }
      })
      .catch(() => {
        if (
          !controller.signal.aborted &&
          requestedRevision === revision.current
        )
          setError(
            "案内の状態を取得できませんでした。接続を確認して再取得してください。",
          );
      });
    return () => {
      mounted.current = false;
      controller.abort();
    };
  }, [reload]);

  async function save(outcome: "completed" | "skipped") {
    if (saving) return false;
    revision.current += 1;
    setSaving(true);
    setError(null);
    try {
      const response = await saveGuideState(outcome);
      if (!mounted.current) return false;
      setState(response.data.guide_state);
      return true;
    } catch {
      if (mounted.current)
        setError(
          "案内の状態を保存できませんでした。入力や業務データは変更していません。もう一度保存してください。",
        );
      return false;
    } finally {
      if (mounted.current) setSaving(false);
    }
  }

  return (
    <HelpSurface
      key={pathname}
      pathname={pathname}
      role={role}
      preference={{
        state,
        error,
        saving,
        save,
        retry: () => setReload((value) => value + 1),
      }}
      dismissed={dismissed}
      onDismiss={() => setDismissed(true)}
    />
  );
}

// ページ遷移で案内を閉じる。案内自身はルーターやフォームの入力を操作しない。
function HelpSurface({
  pathname,
  role,
  preference,
  dismissed = false,
  onDismiss,
}: {
  pathname: string;
  role?: string;
  preference?: Preference;
  dismissed?: boolean;
  onDismiss?: () => void;
}) {
  const guides = guidesForRole(role);
  const current = guideForPath(pathname);
  const [selectedId, setSelectedId] = useState(
    current?.id ?? guides[0]?.id ?? "login",
  );
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"closed" | "help" | "tour">("closed");
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const title = useRef<HTMLHeadingElement | null>(null);
  const touched = useRef(false);
  const topics = guides.filter((guide) =>
    `${guide.title} ${guide.summary} ${guide.topics.map((topic) => topic.title + topic.text).join(" ")}`
      .toLocaleLowerCase("ja")
      .includes(query.trim().toLocaleLowerCase("ja")),
  );
  const selected = topics.find((guide) => guide.id === selectedId) ?? topics[0];
  const steps = overviewSteps(role ?? "viewer");
  const unseen = preference?.state?.status === "unseen";

  useEffect(() => {
    const open = (event: Event) => {
      // 他の確認・入力ダイアログに重ねて自動的に開かない。
      if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
        return;
      trigger.current =
        (event as CustomEvent<{ trigger?: HTMLElement }>).detail?.trigger ??
        null;
      setMode("help");
    };
    const touch = () => {
      touched.current = true;
    };
    const focus = (event: FocusEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches(
          'input, textarea, select, [contenteditable="true"]',
        )
      )
        touched.current = true;
    };
    window.addEventListener(OPEN_HELP_EVENT, open);
    document.addEventListener("focusin", focus, true);
    document.addEventListener("input", touch, true);
    document.addEventListener("change", touch, true);
    return () => {
      window.removeEventListener(OPEN_HELP_EVENT, open);
      document.removeEventListener("focusin", focus, true);
      document.removeEventListener("input", touch, true);
      document.removeEventListener("change", touch, true);
    };
  }, []);

  useEffect(() => {
    if (pathname !== "/dashboard" || !unseen || dismissed) return;
    const timer = window.setTimeout(() => {
      if (
        !touched.current &&
        !document.querySelector('[role="dialog"], [role="alertdialog"]') &&
        !document.activeElement?.matches(
          'input, textarea, select, [contenteditable="true"]',
        )
      )
        setReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [pathname, unseen, dismissed]);

  useEffect(() => {
    if (mode === "tour") title.current?.focus();
  }, [mode, step]);

  function startTour() {
    onDismiss?.();
    setStep(0);
    setMode("tour");
  }
  function close() {
    onDismiss?.();
    setMode("closed");
  }
  async function finish(outcome: "completed" | "skipped") {
    if (await preference?.save(outcome)) close();
  }

  return (
    <>
      {ready && unseen && !dismissed && mode === "closed" && (
        <section
          aria-label="はじめての使い方"
          className="fixed inset-x-4 bottom-4 z-30 space-y-3 rounded-xl bg-card p-4 shadow-lg ring-1 ring-border sm:left-auto sm:w-96"
        >
          <h2 className="font-semibold">Coletteの使い方</h2>
          <p className="text-sm text-muted-foreground">
            予約・顧客・RF分析・設定の基本操作をご案内します。各機能の詳しい説明は、いつでもヘルプで確認できます。
          </p>
          {preference?.error && (
            <p role="alert" className="text-sm text-destructive">
              {preference.error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={(event) => {
                trigger.current = event.currentTarget;
                startTour();
              }}
            >
              ガイドを始める
            </Button>
            <Button
              variant="ghost"
              disabled={preference?.saving}
              onClick={() => void finish("skipped")}
            >
              今回はスキップ
            </Button>
          </div>
        </section>
      )}
      {mode === "tour" && <GuideSpotlight target={steps[step].target} />}
      <Dialog
        open={mode !== "closed"}
        onOpenChange={(open) => {
          if (!open && !preference?.saving) close();
        }}
      >
        <DialogContent
          overlayClassName={
            mode === "tour" ? "bg-transparent backdrop-blur-none" : undefined
          }
          className={
            mode === "tour"
              ? "top-auto right-4 bottom-4 left-4 max-h-[calc(100dvh-2rem)] w-auto max-w-none translate-x-0 translate-y-0 overflow-y-auto sm:left-auto sm:w-[28rem]"
              : "max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl"
          }
          onEscapeKeyDown={(event) => {
            if (preference?.saving) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (document.querySelector('[role="dialog"], [role="alertdialog"]'))
              return;
            const fallback = document.querySelector<HTMLElement>(
              '[data-guide-target="help"]',
            );
            if (trigger.current?.isConnected) trigger.current.focus();
            else fallback?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle ref={title} tabIndex={-1}>
              {mode === "tour" ? steps[step].title : "使い方・ヘルプ"}
            </DialogTitle>
            <DialogDescription>
              {mode === "tour"
                ? "画面の場所を確認する案内です。予約や顧客情報は変更しません。"
                : "現在の画面と全機能の使い方を、画面を移動せず確認できます。"}
            </DialogDescription>
          </DialogHeader>
          {mode === "tour" ? (
            <>
              <p role="status" className="text-xs text-muted-foreground">
                ステップ {step + 1} / {steps.length}
              </p>
              <p className="text-sm leading-relaxed">{steps[step].text}</p>
              {preference?.error && (
                <p role="alert" className="text-sm text-destructive">
                  {preference.error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={step === 0 || preference?.saving}
                  onClick={() => setStep((value) => value - 1)}
                >
                  戻る
                </Button>
                {step < steps.length - 1 ? (
                  <Button onClick={() => setStep((value) => value + 1)}>
                    次へ
                  </Button>
                ) : (
                  <Button
                    disabled={preference?.saving}
                    onClick={() => void finish("completed")}
                  >
                    {preference?.saving ? "保存中…" : "案内を完了"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  disabled={preference?.saving}
                  onClick={() => void finish("skipped")}
                >
                  スキップ
                </Button>
              </div>
            </>
          ) : (
            <>
              {preference?.error && (
                <div role="alert" className="text-sm">
                  <p>{preference.error}</p>
                  <Button variant="outline" onClick={preference.retry}>
                    状態を再取得
                  </Button>
                </div>
              )}
              <Input
                aria-label="ヘルプを検索"
                placeholder="機能名や操作で検索"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="grid min-w-0 gap-6 sm:grid-cols-[13rem_1fr]">
                <nav
                  aria-label="機能別ガイド"
                  className="flex max-h-52 flex-col gap-1 overflow-y-auto sm:max-h-96"
                >
                  {topics.map((guide) => (
                    <Button
                      key={guide.id}
                      variant={
                        selected?.id === guide.id ? "secondary" : "ghost"
                      }
                      className="h-auto min-h-9 justify-start whitespace-normal text-left"
                      aria-current={
                        selected?.id === guide.id ? "true" : undefined
                      }
                      onClick={() => setSelectedId(guide.id)}
                    >
                      {guide.title}
                    </Button>
                  ))}
                  {topics.length === 0 && (
                    <p className="text-sm">一致するガイドはありません。</p>
                  )}
                </nav>
                {selected && (
                  <article
                    aria-label={selected.title}
                    className="min-w-0 space-y-5"
                  >
                    <div>
                      <h2 className="font-semibold">{selected.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {selected.summary}
                      </p>
                    </div>
                    {selected.topics.map((topic) => (
                      <section key={topic.title} className="space-y-2">
                        <h3 className="text-sm font-semibold">{topic.title}</h3>
                        <p className="text-sm leading-relaxed">{topic.text}</p>
                      </section>
                    ))}
                  </article>
                )}
              </div>
              {preference?.state && (
                <p className="text-xs text-muted-foreground">
                  初回案内：
                  {preference.state.status === "completed"
                    ? "完了"
                    : preference.state.status === "skipped"
                      ? "スキップ済み"
                      : "未確認"}
                </p>
              )}
              {role && (
                <Button variant="outline" onClick={startTour}>
                  基本操作の案内を最初から見る
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
