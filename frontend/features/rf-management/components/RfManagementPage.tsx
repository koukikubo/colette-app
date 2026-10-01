import { RfCurrentSettingsSection } from "./settings/RfCurrentSettingsSection";
import { RfRuleSetsSection } from "./rule-sets/RfRuleSetsSection";
import { RfCalculationHistorySection } from "./calculation/RfCalculationHistorySection";

export function RfManagementPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">統一RFマスタ</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          RFルールの設定と、RFランクの計算履歴を管理します。
        </p>
      </header>

      <RfCurrentSettingsSection />
      <RfRuleSetsSection />
      <RfCalculationHistorySection />
    </main>
  );
}
