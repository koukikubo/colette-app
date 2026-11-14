"use client";
import { useApiRead } from "@/hooks/useApiRead";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/common/pagination/PaginationControls";

import { queryPage, useUrlQuery } from "@/hooks/useUrlQuery";
import type { RfRankDropPredictionData } from "../types/rf-rank-drop-prediction";

export function RfRankDropPredictionPage() {
  const { params, update } = useUrlQuery();
  const until = params.get("until_date") ?? "";
  const page = queryPage(params.get("page"));
  const perPage = [20, 50, 100].includes(Number(params.get("per_page")))
    ? Number(params.get("per_page"))
    : 20;
  const [input, setInput] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  if (until) query.set("until_date", until);
  const { data, error, loading } = useApiRead<RfRankDropPredictionData>(
    `/api/v1/rf_rank_drop_predictions?${query}`,
    reload,
  );
  return (
    <main className="space-y-5 p-6">
      <h1 className="text-2xl font-semibold">RFランク低下予定の顧客</h1>
      <nav className="flex gap-4">
        <Link className="underline" href="/rf-rank-drops">
          低下済み
        </Link>
        <span>低下予定</span>
      </nav>
      <p>
        今日以降に来店せず、同じRFルールを使う場合に、初めてランクが下がる日を予測します。予約の有無は反映しません。
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          update({
            until_date: input ?? (until || data?.until_date || ""),
            page: 1,
          });
          setInput(null);
          setReload((v) => v + 1);
        }}
      >
        <label>
          予測期限
          <input
            className="ml-2 rounded border p-2"
            type="date"
            value={input ?? (until || data?.until_date || "")}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>
        <Button disabled={loading}>表示する</Button>
      </form>
      {loading ? (
        <p role="status">低下予定を計算しています。</p>
      ) : error ? (
        <div role="alert">
          {error}
          <Button variant="outline" onClick={() => setReload((v) => v + 1)}>
            再取得
          </Button>
        </div>
      ) : data?.state === "no_current_run" ? (
        <p>
          適用中のRF結果がありません。管理者に計算・適用を依頼してください。
        </p>
      ) : data?.state === "ready" ? (
        <>
          <p>
            予測基準日：{data.base_date} ／ 期限：{data.until_date} ／
            使用ルールの適用基準日：{data.current_run.base_date}
          </p>
          <p>ここでの現在ランクは予測基準日の来店履歴から再計算した値です。</p>
          {data.customers.length === 0 ? (
            <p>期限内に通常ランクが低下する顧客はいません。</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>顧客</th>
                    <th>低下予定日</th>
                    <th>あと何日</th>
                    <th>現在</th>
                    <th>低下後</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customers.map((row) => (
                    <tr key={row.customer_id} className="border-t">
                      <td className="p-3">
                        <Link
                          className="underline"
                          href={`/customers/${row.customer_id}?return_to=${encodeURIComponent(`/rf-rank-drops/predictions?${query}`)}`}
                        >
                          {row.customer_name}
                        </Link>
                      </td>
                      <td>{row.predicted_drop_on}</td>
                      <td>{row.days_until_drop}日</td>
                      <td>{row.current_rank.label}</td>
                      <td>{row.predicted_rank.label}</td>
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
            perPage={perPage}
            onPageChange={(page) => update({ page })}
            onPerPageChange={(per_page) => update({ per_page, page: 1 })}
          />
        </>
      ) : null}
    </main>
  );
}
