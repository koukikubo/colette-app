import { render, screen } from "@testing-library/react";
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
      screen.getByRole("button", { name: "対応完了" }),
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
      screen.queryByRole("button", { name: "対応完了" }),
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
          reservation_status: {
            id: 3,
            code: "completed",
            label: "対応完了",
          },
          completed_at: "2026-09-12T20:30:00+09:00",
        })}
      />,
    );

    expect(screen.getAllByText("対応完了")).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "対応完了" }),
    ).not.toBeInTheDocument();
  });
});
