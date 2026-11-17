import { RfAnalysisSection } from "@/features/rf-analysis/components/RfAnalysisSection";

export function RfAnalysisPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">統一RF分析</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          現在の顧客構成と、前年同月からの変化を確認します。
        </p>
      </header>

      <RfAnalysisSection />
    </main>
  );
}
