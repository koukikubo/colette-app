import { screen } from "@testing-library/react";
import { renderWithOwner as render } from "@/test-utils/auth";
import { describe, expect, it, vi } from "vitest";

import { ReservationDetail } from "../../../components/details/ReservationDetail";
import { createReservation } from "../../fixtures/reservation-fixtures";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

describe("ReservationDetail", () => {
  it("予約の基本情報と遷移リンクを表示する", () => {
    render(<ReservationDetail reservation={createReservation({ id: 30 })} />);

    expect(screen.getAllByText("予約確定")).toHaveLength(2);
    expect(screen.getByText("受付状態")).toBeInTheDocument();
    expect(screen.getByText("来店結果")).toBeInTheDocument();
    expect(screen.getByText("未退店")).toBeInTheDocument();
    expect(screen.getByText("退店処理日時")).toBeInTheDocument();
    expect(screen.getAllByText(/山田 太郎/)).toHaveLength(2);
    expect(screen.getByText("2026/09/08 18:00")).toBeInTheDocument();
    expect(screen.getByText("2026/09/08 20:00")).toBeInTheDocument();
    expect(screen.getByText("2名")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /一覧へ戻る/ })).toHaveAttribute(
      "href",
      "/reservations?date=2026-09-08",
    );
    expect(screen.getByRole("link", { name: /編集する/ })).toHaveAttribute(
      "href",
      "/reservations/30/edit",
    );
    expect(
      screen.getByRole("button", { name: "退店済にする" }),
    ).toBeInTheDocument();
  });

  it("キャンセル済みなら予約状況よりキャンセル表示を優先する", () => {
    render(
      <ReservationDetail
        reservation={createReservation({
          canceled_at: "2026-09-07T12:00:00+09:00",
        })}
      />,
    );

    expect(screen.getAllByText("キャンセル")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "退店済にする" }),
    ).not.toBeInTheDocument();
  });

  it("任意情報が未登録なら代替文言を表示する", () => {
    render(<ReservationDetail reservation={createReservation()} />);
    expect(screen.getAllByText("登録なし").length).toBeGreaterThan(0);
    expect(screen.getAllByText("未割り当て")).toHaveLength(2);
  });

  it("対応完了済みなら対応完了ボタンを表示しない", () => {
    render(
      <ReservationDetail
        reservation={createReservation({
          completed_at: "2026-09-12T20:30:00+09:00",
        })}
      />,
    );

    expect(screen.getAllByText("退店済")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "退店済にする" }),
    ).not.toBeInTheDocument();
  });
});

it("顧客詳細の履歴ページと検索への戻り先を保持する", () => {
  const path = `/customers/10?history_page=2&return_to=${encodeURIComponent("/customers?query=山田&page=3")}`;
  render(
    <ReservationDetail
      reservation={createReservation({ customer_id: 10 })}
      returnTo={path}
    />,
  );
  expect(screen.getByRole("link", { name: "顧客詳細へ戻る" })).toHaveAttribute(
    "href",
    path,
  );
});

it.each([
  "https://example.com",
  "//example.com",
  "/customers/11",
  "/customers/10/hidden",
  "/customers/10/../11",
])("不正な戻り先%sを顧客詳細として扱わない", (returnTo) => {
  render(
    <ReservationDetail
      reservation={createReservation({ customer_id: 10 })}
      returnTo={returnTo}
    />,
  );
  expect(
    screen.queryByRole("link", { name: "顧客詳細へ戻る" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "一覧へ戻る" })).toHaveAttribute(
    "href",
    "/reservations?date=2026-09-08",
  );
});
