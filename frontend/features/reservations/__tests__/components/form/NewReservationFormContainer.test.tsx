import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NewReservationFormContainer } from "../../../components/form/NewReservationFormContainer";
import userEvent from "@testing-library/user-event";
import { ApiClientError } from "@/lib/api/api-client";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createReservation: vi.fn(),

  setCustomerQuery: vi.fn(),
  handleCustomerSearch: vi.fn(),
  handleCustomerSelect: vi.fn(),
  handleCustomerClear: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("@/features/reservations/api/reservation_api", () => ({
  createReservation: mocks.createReservation,
}));

vi.mock("@/features/reservations/hooks/useReservationFormOptions", () => ({
  useReservationFormOptions: () => ({
    requestedRestaurantMasterTypes: [
      {
        id: 1,
        display_code: "TABLE",
        label: "テーブル席",
        description: null,
        position: 1,
        active: true,
      },
    ],
    reservationRoutes: [],
    menuTypes: [],
    reservationOccasions: [],
    reservationStatuses: [
      {
        id: 2,
        display_code: "CONFIRMED",
        label: "予約確定",
        description: null,
        position: 1,
        active: true,
      },
    ],
    restaurantMasters: [],
    isLoading: false,
    errorMessage: null,
  }),
}));

vi.mock("@/features/reservations/hooks/useReservationCustomer", () => ({
  useReservationCustomer: () => ({
    customerQuery: "",
    customers: [],
    isCustomerSearching: false,
    customerSearchPagination: null,
    customerSearchError: null,
    hasSearchedCustomers: false,
    selectedCustomerHasNoPhone: false,
    setCustomerQuery: mocks.setCustomerQuery,
    handleCustomerSearch: mocks.handleCustomerSearch,
    handleCustomerSelect: mocks.handleCustomerSelect,
    handleCustomerClear: mocks.handleCustomerClear,
  }),
}));

vi.mock(
  "@/features/reservations/hooks/useRestaurantMasterAvailability",
  () => ({
    useRestaurantMasterAvailability: () => ({
      unavailableRestaurantMasterIds: [],
      isAvailabilityLoading: false,
      availabilityErrorMessage: null,
    }),
  }),
);

describe("NewReservationFormContainer", () => {
  it("対象日を使って予約フォームの初期値を表示する", () => {
    render(<NewReservationFormContainer targetDate="2026-09-08" />);

    expect(screen.getByText("予約者情報")).toBeInTheDocument();

    expect(screen.getByLabelText(/予約開始日時/)).toHaveValue(
      "2026-09-08T17:00",
    );

    expect(screen.getByLabelText(/予約終了日時/)).toHaveValue(
      "2026-09-08T19:00",
    );

    expect(
      screen.getByRole("spinbutton", {
        name: /人数/,
      }),
    ).toHaveValue(2);

    expect(
      screen.getByRole("button", {
        name: "予約を登録",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("未割り当てのまま予約することもできます。"),
    ).toBeInTheDocument();
  });

  it("予約登録に成功すると、対象日の予約一覧へ移動する", async () => {
    const user = userEvent.setup();

    mocks.createReservation.mockResolvedValue({
      status: "success",
      data: {
        reservation: {},
      },
    });

    render(<NewReservationFormContainer targetDate="2026-09-08" />);

    await user.type(
      screen.getByRole("textbox", {
        name: /予約者名/,
      }),
      "山田 太郎",
    );

    await user.type(
      screen.getByRole("textbox", {
        name: /電話番号/,
      }),
      "09012345678",
    );

    await user.click(
      screen.getByRole("combobox", {
        name: /希望席種/,
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "テーブル席",
      }),
    );

    await user.click(
      screen.getByRole("combobox", {
        name: /予約状況/,
      }),
    );

    await user.click(
      screen.getByRole("option", {
        name: "予約確定",
      }),
    );

    await user.click(
      screen.getByRole("button", {
        name: "予約を登録",
      }),
    );

    await waitFor(() => {
      expect(mocks.createReservation).toHaveBeenCalledWith({
        reservation: {
          customer_id: null,
          reservation_name: "山田 太郎",
          reservation_phone_number: "09012345678",
          reservation_status_id: 2,
          starts_at: "2026-09-08T17:00",
          ends_at: "2026-09-08T19:00",
          guest_count: 2,
          requested_restaurant_master_type_id: 1,
          restaurant_master_ids: [],
          reservation_route_id: null,
          menu_type_id: null,
          occasion_id: null,
          allergy_note: null,
          disliked_food_note: null,
          preferred_food_note: null,
          favorite_drink_note: null,
          request_note: null,
          internal_memo: null,
        },
      });
    });
    expect(mocks.push).toHaveBeenCalledWith("/reservations?date=2026-09-08");
  }, 10_000);

  it("APIが422の項目エラーを返すと、該当する入力欄へエラーを表示する", async () => {
    const user = userEvent.setup();

    mocks.createReservation.mockRejectedValue(
      new ApiClientError("入力内容を確認してください。", 422, {
        reservation_name: ["予約者名を入力してください。"],
        reservation_phone_number: ["電話番号を入力してください。"],
      }),
    );

    render(<NewReservationFormContainer targetDate="2026-09-08" />);

    await user.click(
      screen.getByRole("button", {
        name: "予約を登録",
      }),
    );

    expect(
      await screen.findByText("入力内容を確認してください。"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("予約者名を入力してください。"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("電話番号を入力してください。"),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", {
        name: /予約者名/,
      }),
    ).toHaveAttribute("aria-invalid", "true");

    expect(
      screen.getByRole("textbox", {
        name: /電話番号/,
      }),
    ).toHaveAttribute("aria-invalid", "true");

    expect(
      screen.getByText(
        "入力内容に誤りがあります。赤字で表示された項目を修正してください。",
      ),
    ).toBeInTheDocument();

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("同一顧客の予約重複エラーが発生すると、専用ダイアログを表示する", async () => {
    const user = userEvent.setup();

    mocks.createReservation.mockRejectedValue(
      new ApiClientError(
        "同じ顧客の予約が重複しています。",
        422,
        [],
        "customer_reservation_overlap",
      ),
    );

    render(<NewReservationFormContainer targetDate="2026-09-08" />);

    await user.click(
      screen.getByRole("button", {
        name: "予約を登録",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "予約が重複しています",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "同じ顧客の予約が先に登録または更新されました。予約一覧で最新の予約を確認し、既存の予約を編集してください。",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "入力に戻る",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "予約一覧を確認する",
      }),
    ).toBeInTheDocument();

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("予約重複ダイアログから、予約開始日の一覧へ移動できる", async () => {
    const user = userEvent.setup();

    mocks.createReservation.mockRejectedValue(
      new ApiClientError(
        "同じ顧客の予約が重複しています。",
        422,
        [],
        "customer_reservation_overlap",
      ),
    );

    render(<NewReservationFormContainer targetDate="2026-09-08" />);

    await user.click(
      screen.getByRole("button", {
        name: "予約を登録",
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "予約が重複しています",
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "予約一覧を確認する",
      }),
    );

    expect(mocks.push).toHaveBeenCalledWith("/reservations?date=2026-09-08");

    expect(
      screen.queryByRole("heading", {
        name: "予約が重複しています",
      }),
    ).not.toBeInTheDocument();
  });

  it("予約登録中は送信ボタンを無効にし、重複登録を防止する", async () => {
    const user = userEvent.setup();

    let resolveCreateReservation!: (value: unknown) => void;

    mocks.createReservation.mockReturnValue(
      new Promise((resolve) => {
        resolveCreateReservation = resolve;
      }),
    );

    render(<NewReservationFormContainer targetDate="2026-09-08" />);

    const submitButton = screen.getByRole("button", {
      name: "予約を登録",
    });

    await user.click(submitButton);

    const submittingButton = await screen.findByRole("button", {
      name: "登録中…",
    });

    expect(submittingButton).toBeDisabled();
    expect(mocks.createReservation).toHaveBeenCalledTimes(1);

    // 無効化されたボタンを再度クリックしてもAPIは増えない
    await user.click(submittingButton);

    expect(mocks.createReservation).toHaveBeenCalledTimes(1);

    // 保留していたAPIを成功させる
    resolveCreateReservation({
      status: "success",
      data: {
        reservation: {},
      },
    });

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/reservations?date=2026-09-08");
    });
  });
});
