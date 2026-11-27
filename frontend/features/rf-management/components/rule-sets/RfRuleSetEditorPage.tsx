"use client";

import { PageHeading } from "@/components/common/page-heading";

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
      <div className="space-y-6 p-4 lg:p-6">
        <PageHeading>統一RFマスタ 設定編集</PageHeading>
        <div role="status" className="space-y-4">
          <span className="sr-only">RFルールを読み込んでいます。</span>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-4 lg:p-6">
        <PageHeading>統一RFマスタ 設定編集</PageHeading>
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          RFルールを編集できるのはオーナーのみです。
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-4 lg:p-6">
        <PageHeading>統一RFマスタ 設定編集</PageHeading>
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!ruleSet) {
    return <PageHeading>統一RFマスタ 設定編集</PageHeading>;
  }

  if (ruleSet.status !== "draft") {
    return (
      <div className="space-y-6 p-4 lg:p-6">
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
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <header className="colette-surface flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ruleSet.name}
          </h1>
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
    </div>
  );
}
