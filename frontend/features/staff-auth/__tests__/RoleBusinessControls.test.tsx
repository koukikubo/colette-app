import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithRole } from "@/test-utils/auth";
import { CustomerTable } from "@/features/customers/components/list/CustomerTable";
import { ReservationStatusActions } from "@/features/reservations/components/details/ReservationStatusActions";
import { createReservation } from "@/features/reservations/__tests__/fixtures/reservation-fixtures";
import type { Customer } from "@/features/customers/types";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
it("viewerは顧客詳細を開けるが編集ボタンと予約状態変更は使えない", () => {
  const customer = {
    id: 1,
    customer_kind: "individual",
    name: "顧客",
    kana: "コキャク",
    hidden_at: null,
    phone_number: null,
    email: null,
    customer_rank: null,
    company_name: null,
  } as Customer;
  renderWithRole(
    <>
      <CustomerTable customers={[customer]} onEdit={vi.fn()} />
      <ReservationStatusActions reservation={createReservation()} />
    </>,
    "viewer",
  );
  expect(screen.getByRole("link", { name: /詳細/ })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /編集/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "対応完了" }),
  ).not.toBeInTheDocument();
});
