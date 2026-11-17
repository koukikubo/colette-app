import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import type { ReservationFormValues } from "../../../types";
import { createReservation } from "../../fixtures/reservation-fixtures";
import { ReservationRouteModal } from "../../../components/layouts/reservation-route-modal";
import { EditReservationFormContainer } from "../../../components/form/EditReservationFormContainer";
const mocks = vi.hoisted(() => ({ back: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("../../../hooks/useReservation", () => ({
  useReservation: () => ({
    reservation: createReservation(),
    isLoading: false,
    errorMessage: null,
  }),
}));
vi.mock("../../../hooks/useReservationFormOptions", () => ({
  useReservationFormOptions: () => ({
    requestedRestaurantMasterTypes: [],
    reservationRoutes: [],
    menuTypes: [],
    reservationOccasions: [],
    reservationStatuses: [],
    restaurantMasters: [],
    isLoading: false,
    errorMessage: null,
  }),
}));
vi.mock("../../../hooks/useRestaurantMasterAvailability", () => ({
  useRestaurantMasterAvailability: () => ({
    unavailableRestaurantMasterIds: [],
    isAvailabilityLoading: false,
    availabilityErrorMessage: null,
  }),
}));
// 顧客解除は実フックを通し、DOM changeを発火しない実際の変更経路を検証する。
vi.mock("../../../components/form/ReservationForm", () => ({
  ReservationForm: ({
    onCustomerClear,
    values,
  }: {
    onCustomerClear: () => void;
    values: ReservationFormValues;
  }) => (
    <>
      <button onClick={onCustomerClear}>顧客選択を解除</button>
      <output>{values.customer_id === null ? "解除済み" : "選択中"}</output>
    </>
  ),
}));
it("顧客解除だけの編集もEscapeと閉じる操作で破棄確認する", async () => {
  const user = userEvent.setup();
  render(
    <ReservationRouteModal title="予約編集">
      <EditReservationFormContainer reservationId={1} />
    </ReservationRouteModal>,
  );
  await user.click(screen.getByRole("button", { name: "顧客選択を解除" }));
  expect(screen.getByText("解除済み")).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(await screen.findByRole("alertdialog")).toHaveTextContent(
    "入力内容を破棄",
  );
  expect(mocks.back).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "編集を続ける" }));
  expect(screen.getByText("解除済み")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  await user.click(screen.getByRole("button", { name: "破棄して移動" }));
  expect(mocks.back).toHaveBeenCalledTimes(1);
});
it("変更していなければ確認なしで閉じる", async () => {
  const user = userEvent.setup();
  render(
    <ReservationRouteModal title="予約編集">
      <EditReservationFormContainer reservationId={1} />
    </ReservationRouteModal>,
  );
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(mocks.back).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
});
