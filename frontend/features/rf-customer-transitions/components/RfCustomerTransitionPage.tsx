import { RfCustomerTransitionSection } from "./RfCustomerTransitionSection";

export function RfCustomerTransitionPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="border-b pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          RFランク客層変動表
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          開始月と終了月を指定し、同じ顧客のRFランクの変動を確認します。
        </p>
      </header>

      <RfCustomerTransitionSection />
    </main>
  );
}
