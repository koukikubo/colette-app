import { PageHeading } from "@/components/common/page-heading";
import { RfAnalysisSection } from "@/features/rf-analysis/components/RfAnalysisSection";

export function RfAnalysisPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <PageHeading>統一RFランク表</PageHeading>

      <RfAnalysisSection />
    </div>
  );
}
