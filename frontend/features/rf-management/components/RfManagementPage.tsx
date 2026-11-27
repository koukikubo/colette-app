"use client";

import { PageHeading } from "@/components/common/page-heading";

import { useState } from "react";

import { RfCurrentSettingsSection } from "./settings/RfCurrentSettingsSection";
import { RfRuleSetsSection } from "./rule-sets/RfRuleSetsSection";
import { RfCalculationHistorySection } from "./calculation/RfCalculationHistorySection";
import { RfCalculationExecutionSection } from "./calculation/RfCalculationExecutionSection";
import { RfRankColorSettingsSection } from "./settings/RfRankColorSettingsSection";

export function RfManagementPage() {
  const [settingsReloadKey, setSettingsReloadKey] = useState(0);
  const [calculationReloadKey, setCalculationReloadKey] = useState(0);

  function reloadCalculationData() {
    setSettingsReloadKey((current) => current + 1);
    setCalculationReloadKey((current) => current + 1);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <PageHeading>統一RFマスタ</PageHeading>

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
      <RfRankColorSettingsSection
        onColorsChanged={() => setSettingsReloadKey((current) => current + 1)}
      />
    </div>
  );
}
