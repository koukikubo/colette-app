/**
 * RFランク移動の全体像を表示する。
 *
 * 通常ランクの上昇・維持・下降を主要カードとして表示し、
 * 対象外・未分類・来店履歴なしなどは別枠にまとめる。
 *
 * APIの集計値をそのまま使用し、画面側で移動区分を再判定しない。
 */
import type {
  RfCustomerMovementSummary,
  RfMovementCategory,
} from "../types/customer-transition";

type Props = {
  counts: RfCustomerMovementSummary["counts"];
};

const primaryItems = [
  {
    category: "up",
    label: "上昇",
    symbol: "↑",
    description: "開始時点より上位のランクへ",
    tone: "border-teal-200 bg-teal-50/60 dark:border-teal-900 dark:bg-teal-950/30",
    accent: "text-teal-700 dark:text-teal-300",
  },
  {
    category: "unchanged",
    label: "維持",
    symbol: "＝",
    description: "開始・終了で同じランク",
    tone: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40",
    accent: "text-slate-700 dark:text-slate-200",
  },
  {
    category: "down",
    label: "下降",
    symbol: "↓",
    description: "開始時点より下位のランクへ",
    tone: "border-orange-200 bg-orange-50/60 dark:border-orange-900 dark:bg-orange-950/30",
    accent: "text-orange-700 dark:text-orange-300",
  },
] satisfies {
  category: RfMovementCategory;
  label: string;
  symbol: string;
  description: string;
  tone: string;
  accent: string;
}[];

const otherItems = [
  { category: "same_position", label: "同順位の別ランク" },
  { category: "no_visit", label: "来店履歴なしを含む" },
  { category: "unmatched", label: "未分類を含む" },
  { category: "excluded", label: "対象外を含む" },
  { category: "added", label: "終了時点のみ記録あり" },
  { category: "removed", label: "開始時点のみ記録あり" },
] satisfies {
  category: RfMovementCategory;
  label: string;
}[];

/**
 * 移動区分別人数を、主要3区分とその他の区分に分けて表示する。
 *
 * 「比較した顧客」は、どちらかの時点に記録がある顧客の総数。
 * 同じ顧客を複数区分へ重複集計しないAPIの仕様を前提とする。
 */
export function RfMovementOverview({ counts }: Props) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <section aria-labelledby="rf-movement-overview-heading">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="rf-movement-overview-heading" className="font-semibold">
          顧客の動き
        </h3>

        <p className="text-sm text-muted-foreground">
          比較した顧客
          <span className="ml-2 font-semibold tabular-nums text-foreground">
            {total.toLocaleString("ja-JP")}人
          </span>
        </p>
      </div>

      <dl
        className="grid gap-3 sm:grid-cols-3"
        aria-label="通常ランクの移動人数"
      >
        {primaryItems.map((item) => (
          <div
            key={item.category}
            className={`rounded-xl border p-5 ${item.tone}`}
          >
            <dt
              className={`flex items-center gap-2 text-sm font-medium ${item.accent}`}
            >
              <span aria-hidden="true">{item.symbol}</span>
              {item.label}
            </dt>

            <dd className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
              {counts[item.category].toLocaleString("ja-JP")}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                人
              </span>
            </dd>

            <p className="mt-2 text-xs text-muted-foreground">
              {item.description}
            </p>
          </div>
        ))}
      </dl>

      <div className="mt-4 rounded-xl border bg-muted/20 p-4">
        <h4 className="text-sm font-medium">その他の移動・状態</h4>

        <p className="mt-1 text-xs text-muted-foreground">
          以下の区分は、上の上昇・維持・下降には含めていません。
        </p>

        <dl
          className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-label="その他の移動人数"
        >
          {otherItems.map((item) => (
            <div
              key={item.category}
              className="flex items-baseline justify-between gap-3"
            >
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="shrink-0 text-sm font-semibold tabular-nums">
                {counts[item.category].toLocaleString("ja-JP")}人
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
