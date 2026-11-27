import { PageHeading } from "@/components/common/page-heading";
import { RfCustomerTransitionSection } from "./RfCustomerTransitionSection";

export function RfCustomerTransitionPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <PageHeading>RFランク客層変動表</PageHeading>
      <p className="text-sm text-muted-foreground">
        同じ顧客のRFランクを、開始月と終了月で比較します。
      </p>

      <RfCustomerTransitionSection />
    </div>
  );
}
