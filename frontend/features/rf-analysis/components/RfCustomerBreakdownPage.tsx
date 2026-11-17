"use client";
import { useApiRead } from "@/hooks/useApiRead";
import Link from "next/link";
import { useState } from "react";

import { useUrlQuery } from "@/hooks/useUrlQuery";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/common/pagination/PaginationControls";
import type { Pagination } from "@/lib/api/pagination";
import type { RfTransitionRank } from "@/features/rf-customer-transitions/types/customer-transition";
import { safeReturnPath } from "@/lib/api/session-events";

type Data = {
  run: { id: number; base_date: string };
  comparison_run: { id: number; base_date: string } | null;
  filters: Record<string, string>;
  cell_labels?: { recency?: string; frequency?: string };
  ranks: RfTransitionRank[];
  comparison_ranks: RfTransitionRank[];
  customers: {
    customer_id: number;
    customer_name: string;
    from_rank: RfTransitionRank | null;
    to_rank: RfTransitionRank | null;
    from_state: string | null;
    to_state: string;
    category: string | null;
    last_visit_on: string | null;
    frequency_count: number | null;
  }[];
  pagination: Pagination;
};
const labels: Record<string, string> = {
  up: "上昇",
  down: "下降",
  unchanged: "維持",
  same_position: "同順位の別ランク",
  added: "終了時点のみ",
  removed: "開始時点のみ",
  excluded: "計算対象外",
  unmatched: "未分類",
  no_visit: "来店履歴なし",
  missing: "記録なし",
  ranked: "ランクあり",
};
export function RfCustomerBreakdownPage() {
  const { params, update } = useUrlQuery();
  const query = params.toString();
  const [reload, setReload] = useState(0);
  const { data, error, loading } = useApiRead<Data>(
    `/api/v1/rf_customers?${query}`,
    reload,
  );
  const back = params.get("return_to")
    ? safeReturnPath(params.get("return_to"))
    : "/rf-analysis";
  return (
    <main className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold">RF分析の対象顧客</h1>
      <Link className="underline" href={back}>
        分析画面に戻る
      </Link>
      {loading ? (
        <p role="status">顧客の内訳を読み込んでいます。</p>
      ) : error ? (
        <div role="alert">
          {error}
          <Button variant="outline" onClick={() => setReload((v) => v + 1)}>
            再取得
          </Button>
        </div>
      ) : (
        data && (
          <>
            <p>
              {data.comparison_run
                ? `${data.comparison_run.base_date} → `
                : "計算基準日："}
              {data.run.base_date}
            </p>
            <p>
              条件：
              {[
                labels[data.filters.category],
                data.ranks.find(
                  (rank) => rank.id === Number(data.filters.rf_rank_id),
                )?.label,
                data.cell_labels?.recency,
                data.cell_labels?.frequency,
                data.filters.from_state
                  ? `開始：${data.comparison_ranks.find((rank) => rank.id === Number(data.filters.from_rank_id))?.label ?? labels[data.filters.from_state]}`
                  : undefined,
                data.filters.to_state
                  ? `終了：${data.ranks.find((rank) => rank.id === Number(data.filters.to_rank_id))?.label ?? labels[data.filters.to_state]}`
                  : undefined,
              ]
                .filter(Boolean)
                .join(" ／ ") || "全顧客"}{" "}
              ／ {data.pagination.total_count}人
            </p>
            <p className="text-sm text-muted-foreground">
              顧客名から顧客詳細・予約履歴へ進めます。ランクは選択した計算履歴の値です。
            </p>
            {data.customers.length === 0 ? (
              <p>この条件の顧客はいません。</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th>顧客</th>
                      {data.comparison_run && <th>開始時点</th>}
                      <th>終了・対象時点</th>
                      <th>変動</th>
                      <th>最終来店日</th>
                      <th>来店回数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.map((row) => (
                      <tr key={row.customer_id} className="border-t">
                        <td className="p-3">
                          <Link
                            className="underline"
                            href={`/customers/${row.customer_id}?return_to=${encodeURIComponent(`/rf-customers?${query}`)}`}
                          >
                            {row.customer_name}
                          </Link>
                        </td>
                        {data.comparison_run && (
                          <td>
                            {row.from_rank?.label ??
                              labels[row.from_state ?? "missing"]}
                          </td>
                        )}
                        <td>{row.to_rank?.label ?? labels[row.to_state]}</td>
                        <td>{row.category ? labels[row.category] : "—"}</td>
                        <td>{row.last_visit_on ?? "—"}</td>
                        <td>{row.frequency_count ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <PaginationControls
              currentPage={data.pagination.current_page}
              totalPages={data.pagination.total_pages}
              totalCount={data.pagination.total_count}
              perPage={Number(params.get("per_page")) || 20}
              onPageChange={(page) => update({ page })}
              onPerPageChange={(per_page) => update({ per_page, page: 1 })}
            />
          </>
        )
      )}
    </main>
  );
}
