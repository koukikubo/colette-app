"use client";

import { useState } from "react";

import { RfCurrentSettingsSection } from "./settings/RfCurrentSettingsSection";
import { RfRuleSetsSection } from "./rule-sets/RfRuleSetsSection";
import { RfCalculationHistorySection } from "./calculation/RfCalculationHistorySection";
import { RfCalculationExecutionSection } from "./calculation/RfCalculationExecutionSection";

export function RfManagementPage() {
  const [settingsReloadKey, setSettingsReloadKey] = useState(0);
  const [calculationReloadKey, setCalculationReloadKey] = useState(0);

  function reloadCalculationData() {
    setSettingsReloadKey((current) => current + 1);
    setCalculationReloadKey((current) => current + 1);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">統一RFマスタ</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          RFルールの設定と、RFランクの計算履歴を管理します。
        </p>
      </header>

      <RfCurrentSettingsSection reloadKey={settingsReloadKey} />

      <RfCalculationExecutionSection
        reloadKey={settingsReloadKey}
        onCalculationCompleted={reloadCalculationData}
      />

      <RfRuleSetsSection
        onSettingsChanged={() => setSettingsReloadKey((current) => current + 1)}
      />
      <RfCalculationHistorySection
        reloadKey={calculationReloadKey}
        onApplied={reloadCalculationData}
      />
    </main>
  );
}
