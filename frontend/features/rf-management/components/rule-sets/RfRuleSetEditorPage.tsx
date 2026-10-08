"use client";

import { Badge } from "@/components/ui/badge";
import { RfRuleSetDraftEditor } from "./RfRuleSetDraftEditor";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/staff-auth/hooks/use-auth";

import { useRfRuleSetDetail } from "../../hooks/useRfRuleSetDetail";
import { RfRuleSetStatusBadge } from "../status/RfStatusBadge";

type RfRuleSetEditorPageProps = {
  ruleSetId: number;
};

export function RfRuleSetEditorPage({ ruleSetId }: RfRuleSetEditorPageProps) {
  const { staff, status: authStatus } = useAuth();
  const isOwner = staff?.staff_master.role_code === "owner";

  const { ruleSet, isLoading, errorMessage } = useRfRuleSetDetail({
    ruleSetId: isOwner ? ruleSetId : null,
  });

  if (authStatus === "loading" || (isOwner && isLoading)) {
    return (
      <main className="space-y-6 p-4 lg:p-6">
        <div role="status" className="space-y-4">
          <span className="sr-only">RFルールを読み込んでいます。</span>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!isOwner) {
    return (
      <main className="p-4 lg:p-6">
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          RFルールを編集できるのはオーナーのみです。
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="p-4 lg:p-6">
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      </main>
    );
  }

  if (!ruleSet) {
    return null;
  }

  if (ruleSet.status !== "draft") {
    return (
      <main className="space-y-6 p-4 lg:p-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ruleSet.name}
          </h1>
        </header>

        <div
          role="alert"
          className="rounded-lg border p-4 text-sm text-muted-foreground"
        >
          公開中またはアーカイブ済みのRFルールは編集できません。
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-4 lg:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ruleSet.name}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            RFルールの条件とランク対応表を順番に設定します。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <RfRuleSetStatusBadge status={ruleSet.status} />

          <Badge variant="secondary">バージョン {ruleSet.version}</Badge>
        </div>
      </header>

      <RfRuleSetDraftEditor
        key={`${ruleSet.id}-${ruleSet.lock_version}`}
        ruleSet={ruleSet}
      />
    </main>
  );
}
