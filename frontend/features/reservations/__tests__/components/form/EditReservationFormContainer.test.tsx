import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EditReservationFormContainer } from "../../../components/form/EditReservationFormContainer";
import { createReservation } from "../../fixtures/reservation-fixtures";
import userEvent from "@testing-library/user-event";
import type { Dispatch, SetStateAction } from "react";
import type { ReservationFormValues } from "../../../types";
import { ApiClientError } from "@/lib/api/api-client";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  updateReservation: vi.fn(),
  useReservation: vi.fn(),
  useReservationFormOptions: vi.fn(),

  setCustomerQuery: vi.fn(),
  handleCustomerSearch: vi.fn(),
  handleCustomerSelect: vi.fn(),
  handleCustomerClear: vi.fn(),

  requestNavigation: vi.fn(),
  confirmDiscard: vi.fn(),
  handleDiscardDialogOpenChange: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("@/features/reservations/api/reservation_api", () => ({
  updateReservation: mocks.updateReservation,
}));

vi.mock("@/features/reservations/hooks/useReservation", () => ({
  useReservation: mocks.useReservation,
}));

vi.mock("@/features/reservations/hooks/useReservationFormOptions", () => ({
  useReservationFormOptions: mocks.useReservationFormOptions,
}));

vi.mock("@/features/reservations/hooks/useReservationCustomer", () => ({
  useReservationCustomer: ({
    setValues,
  }: {
    setValues: Dispatch<SetStateAction<ReservationFormValues>>;
  }) => ({
    customerQuery: "",
    customers: [],
    customerSearchPagination: null,
    isCustomerSearching: false,
    customerSearchError: null,
    hasSearchedCustomers: false,
    selectedCustomerHasNoPhone: false,
    setCustomerQuery: mocks.setCustomerQuery,
    handleCustomerSearch: mocks.handleCustomerSearch,
    handleCustomerSelect: mocks.handleCustomerSelect,
    handleCustomerClear: () => {
      mocks.handleCustomerClear();

      setValues((currentValues) => ({
        ...currentValues,
        customer_id: null,
      }));
    },
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

vi.mock("@/hooks/useUnsavedChangesGuard", () => ({
  useUnsavedChangesGuard: () => ({
    discardDialogOpen: false,
    requestNavigation: mocks.requestNavigation,
    confirmDiscard: mocks.confirmDiscard,
    handleDiscardDialogOpenChange: mocks.handleDiscardDialogOpenChange,
  }),
}));

describe("EditReservationFormContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useReservationFormOptions.mockReturnValue({
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
          id: 1,
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
    });
  });
  it("取得した予約情報を編集フォームの初期値として表示する", () => {
    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    render(<EditReservationFormContainer reservationId={30} />);

    expect(mocks.useReservation).toHaveBeenCalledWith(30);

    expect(
      screen.getByRole("textbox", {
        name: /予約者名/,
      }),
    ).toHaveValue("山田 太郎");

    expect(
      screen.getByRole("textbox", {
        name: /電話番号/,
      }),
    ).toHaveValue("09012345678");

    expect(screen.getByLabelText(/予約開始日時/)).toHaveValue(
      "2026-09-08T18:00",
    );

    expect(screen.getByLabelText(/予約終了日時/)).toHaveValue(
      "2026-09-08T20:00",
    );

    expect(
      screen.getByRole("spinbutton", {
        name: /人数/,
      }),
    ).toHaveValue(3);

    expect(
      screen.getByRole("combobox", {
        name: /希望席種/,
      }),
    ).toHaveTextContent("テーブル席");

    expect(
      screen.getByRole("combobox", {
        name: /予約状況/,
      }),
    ).toHaveTextContent("予約確定");

    expect(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "閉じる",
      }),
    ).toBeInTheDocument();
  });

  it("予約情報の取得中は、読み込みメッセージを表示する", () => {
    mocks.useReservation.mockReturnValue({
      reservation: null,
      isLoading: true,
      errorMessage: null,
    });

    render(<EditReservationFormContainer reservationId={30} />);

    expect(
      screen.getByText("予約情報を読み込んでいます。"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "予約を更新",
      }),
    ).not.toBeInTheDocument();
  });

  it("予約情報の取得に失敗すると、APIのエラーメッセージを表示する", () => {
    mocks.useReservation.mockReturnValue({
      reservation: null,
      isLoading: false,
      errorMessage: "予約情報の取得に失敗しました。",
    });

    render(<EditReservationFormContainer reservationId={30} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "予約情報の取得に失敗しました。",
    );

    expect(
      screen.queryByRole("button", {
        name: "予約を更新",
      }),
    ).not.toBeInTheDocument();
  });

  it("予約情報が存在しない場合、表示できないことを案内する", () => {
    mocks.useReservation.mockReturnValue({
      reservation: null,
      isLoading: false,
      errorMessage: null,
    });

    render(<EditReservationFormContainer reservationId={30} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "予約情報を表示できませんでした。",
    );

    expect(
      screen.queryByRole("button", {
        name: "予約を更新",
      }),
    ).not.toBeInTheDocument();
  });

  it("予約内容を変更して更新できる", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.updateReservation.mockResolvedValue({
      status: "success",
      data: {
        reservation: {
          ...reservation,
          reservation_name: "山田 次郎",
          lock_version: 5,
        },
      },
    });

    render(<EditReservationFormContainer reservationId={30} />);

    const reservationNameInput = screen.getByRole("textbox", {
      name: /予約者名/,
    });

    const clearCustomerButton = screen.getByRole("button", {
      name: "顧客選択を解除",
    });

    await user.click(clearCustomerButton);

    await waitFor(() => {
      expect(reservationNameInput).not.toHaveAttribute("readonly");
    });

    await user.clear(reservationNameInput);
    await user.type(reservationNameInput, "山田 次郎");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    const confirmDialog = screen.getByRole("alertdialog", {
      name: "予約内容を更新しますか？",
    });
    expect(
      within(confirmDialog).getByRole("heading", {
        name: "予約内容を更新しますか？",
      }),
    ).toBeInTheDocument();

    expect(within(confirmDialog).getByText("予約者名")).toBeInTheDocument();
    expect(within(confirmDialog).getByText("山田 太郎")).toBeInTheDocument();
    expect(within(confirmDialog).getByText("山田 次郎")).toBeInTheDocument();

    await user.click(
      within(confirmDialog).getByRole("button", {
        name: "更新する",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateReservation).toHaveBeenCalledWith(30, {
        reservation: {
          customer_id: null,
          reservation_name: "山田 次郎",
          reservation_phone_number: "09012345678",
          reservation_status_id: 1,
          starts_at: "2026-09-08T18:00",
          ends_at: "2026-09-08T20:00",
          guest_count: 3,
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
          lock_version: 4,
        },
      });
    });

    expect(mocks.push).toHaveBeenCalledWith("/reservations/30");
  });

  it("予約情報の更新に失敗すると、APIのエラーメッセージを表示する", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.updateReservation.mockRejectedValue(
      new ApiClientError("予約情報の更新に失敗しました。", 500),
    );

    render(<EditReservationFormContainer reservationId={30} />);

    const guestCountInput = screen.getByRole("spinbutton", {
      name: /人数/,
    });

    await user.clear(guestCountInput);
    await user.type(guestCountInput, "4");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    const confirmDialog = screen.getByRole("alertdialog", {
      name: "予約内容を更新しますか？",
    });

    await user.click(
      within(confirmDialog).getByRole("button", {
        name: "更新する",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateReservation).toHaveBeenCalledOnce();
    });
    await waitFor(() => {
      expect(mocks.updateReservation).toHaveBeenCalledOnce();
    });

    expect(
      await screen.findByText("予約情報の更新に失敗しました。"),
    ).toBeInTheDocument();

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("予約更新中に予期しないエラーが発生すると、共通メッセージを表示する", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.updateReservation.mockRejectedValue(new Error("想定外のエラー"));

    render(<EditReservationFormContainer reservationId={30} />);

    // 更新可能にするため、予約内容を変更する
    const guestCountInput = screen.getByRole("spinbutton", {
      name: /人数/,
    });

    await user.clear(guestCountInput);
    await user.type(guestCountInput, "4");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    const confirmDialog = screen.getByRole("alertdialog", {
      name: "予約内容を更新しますか？",
    });

    const updateButton = within(confirmDialog).getByRole("button", {
      name: "更新する",
    });

    expect(updateButton).toBeEnabled();

    await user.click(updateButton);

    await waitFor(() => {
      expect(mocks.updateReservation).toHaveBeenCalledOnce();
    });

    expect(
      await screen.findByText("予約の更新中に予期しないエラーが発生しました。"),
    ).toBeInTheDocument();

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("更新APIが422の項目別エラーを返すと、該当項目にエラーを表示する", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.updateReservation.mockRejectedValue(
      new ApiClientError("入力内容を確認してください。", 422, {
        guest_count: ["人数は1以上で入力してください。"],
      }),
    );

    render(<EditReservationFormContainer reservationId={30} />);

    const guestCountInput = screen.getByRole("spinbutton", {
      name: /人数/,
    });

    // 変更がないと「更新する」が無効になるため、値を変更する
    await user.clear(guestCountInput);
    await user.type(guestCountInput, "4");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    const confirmDialog = screen.getByRole("alertdialog", {
      name: "予約内容を更新しますか？",
    });

    await user.click(
      within(confirmDialog).getByRole("button", {
        name: "更新する",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateReservation).toHaveBeenCalledOnce();
    });

    expect(
      await screen.findByText("人数は1以上で入力してください。"),
    ).toBeInTheDocument();

    expect(guestCountInput).toHaveAttribute("aria-invalid", "true");

    expect(
      screen.queryByRole("alertdialog", {
        name: "予約内容を更新しますか？",
      }),
    ).not.toBeInTheDocument();

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("更新競合が発生すると、再取得を促すエラーを表示する", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.updateReservation.mockRejectedValue(
      new ApiClientError(
        "予約情報が他の担当者によって更新されています。",
        409,
        ["最新の予約情報を再取得してから、もう一度操作してください。"],
      ),
    );

    render(<EditReservationFormContainer reservationId={30} />);

    const guestCountInput = screen.getByRole("spinbutton", {
      name: /人数/,
    });

    await user.clear(guestCountInput);
    await user.type(guestCountInput, "4");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    const confirmDialog = screen.getByRole("alertdialog", {
      name: "予約内容を更新しますか？",
    });

    await user.click(
      within(confirmDialog).getByRole("button", {
        name: "更新する",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateReservation).toHaveBeenCalledOnce();
    });

    expect(
      await screen.findByText(
        "予約情報が他の担当者によって更新されています。 最新の予約情報を再取得してから、もう一度操作してください。",
      ),
    ).toBeInTheDocument();

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("同一顧客の予約重複エラーが発生すると、専用ダイアログを表示する", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.updateReservation.mockRejectedValue(
      new ApiClientError(
        "同じ顧客の予約が重複しています。",
        422,
        [],
        "customer_reservation_overlap",
      ),
    );

    render(<EditReservationFormContainer reservationId={30} />);

    // 変更がないと更新ボタンが無効になるため、人数を変更する
    const guestCountInput = screen.getByRole("spinbutton", {
      name: /人数/,
    });

    await user.clear(guestCountInput);
    await user.type(guestCountInput, "4");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    const updateConfirmDialog = screen.getByRole("alertdialog", {
      name: "予約内容を更新しますか？",
    });

    await user.click(
      within(updateConfirmDialog).getByRole("button", {
        name: "更新する",
      }),
    );

    await waitFor(() => {
      expect(mocks.updateReservation).toHaveBeenCalledOnce();
    });

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

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.updateReservation.mockRejectedValue(
      new ApiClientError(
        "同じ顧客の予約が重複しています。",
        422,
        [],
        "customer_reservation_overlap",
      ),
    );

    render(<EditReservationFormContainer reservationId={30} />);

    const guestCountInput = screen.getByRole("spinbutton", {
      name: /人数/,
    });

    await user.clear(guestCountInput);
    await user.type(guestCountInput, "4");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    const updateConfirmDialog = screen.getByRole("alertdialog", {
      name: "予約内容を更新しますか？",
    });

    await user.click(
      within(updateConfirmDialog).getByRole("button", {
        name: "更新する",
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

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith("/reservations?date=2026-09-08");
    });
  });

  it("更新処理中に再操作しても、更新APIを二重送信しない", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    // resolveされないPromiseにして、更新処理中の状態を維持する
    mocks.updateReservation.mockReturnValue(new Promise(() => {}));

    render(<EditReservationFormContainer reservationId={30} />);

    const guestCountInput = screen.getByRole("spinbutton", {
      name: /人数/,
    });

    await user.clear(guestCountInput);
    await user.type(guestCountInput, "4");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    const confirmDialog = screen.getByRole("alertdialog", {
      name: "予約内容を更新しますか？",
    });

    const updateButton = within(confirmDialog).getByRole("button", {
      name: "更新する",
    });

    await user.click(updateButton);

    await waitFor(() => {
      expect(mocks.updateReservation).toHaveBeenCalledOnce();
    });

    const submittingButton = within(confirmDialog).getByRole("button", {
      name: "更新中…",
    });

    expect(submittingButton).toBeDisabled();

    // disabledのため、再クリックしてもAPIは呼ばれない
    await user.click(submittingButton);

    expect(mocks.updateReservation).toHaveBeenCalledOnce();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("閉じるを押すと、編集中の予約詳細へ戻る", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.requestNavigation.mockImplementation((navigation: () => void) => {
      navigation();
    });

    render(<EditReservationFormContainer reservationId={30} />);

    await user.click(
      screen.getByRole("button", {
        name: "閉じる",
      }),
    );

    expect(mocks.requestNavigation).toHaveBeenCalledOnce();

    expect(mocks.push).toHaveBeenCalledWith("/reservations/30");
  });

  it("更新確認ダイアログで戻ると、変更内容を保持したまま入力画面へ戻る", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    render(<EditReservationFormContainer reservationId={30} />);

    const guestCountInput = screen.getByRole("spinbutton", {
      name: /人数/,
    });

    await user.clear(guestCountInput);
    await user.type(guestCountInput, "4");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    const confirmDialog = screen.getByRole("alertdialog", {
      name: "予約内容を更新しますか？",
    });

    expect(within(confirmDialog).getByText("予約人数")).toBeInTheDocument();

    expect(within(confirmDialog).getByText("3名")).toBeInTheDocument();
    expect(within(confirmDialog).getByText("4名")).toBeInTheDocument();

    await user.click(
      within(confirmDialog).getByRole("button", {
        name: "戻って修正する",
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("alertdialog", {
          name: "予約内容を更新しますか？",
        }),
      ).not.toBeInTheDocument();
    });

    expect(guestCountInput).toHaveValue(4);
    expect(mocks.updateReservation).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("終了日時が開始日時以前の場合、入力エラーを表示して更新しない", async () => {
    const user = userEvent.setup();

    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    render(<EditReservationFormContainer reservationId={30} />);

    const endDateTimeInput = screen.getByLabelText(/予約終了日時/);

    await user.clear(endDateTimeInput);
    await user.type(endDateTimeInput, "2026-09-08T17:00");

    await user.click(
      screen.getByRole("button", {
        name: "予約を更新",
      }),
    );

    expect(
      await screen.findByText(
        "予約終了日時は予約開始日時より後に指定してください",
      ),
    ).toBeInTheDocument();

    expect(endDateTimeInput).toHaveAttribute("aria-invalid", "true");

    expect(
      screen.queryByRole("alertdialog", {
        name: "予約内容を更新しますか？",
      }),
    ).not.toBeInTheDocument();

    expect(mocks.updateReservation).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("フォームの選択肢を取得中は、読み込みメッセージを表示する", () => {
    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.useReservationFormOptions.mockReturnValue({
      requestedRestaurantMasterTypes: [],
      reservationRoutes: [],
      menuTypes: [],
      reservationOccasions: [],
      reservationStatuses: [],
      restaurantMasters: [],
      isLoading: true,
      errorMessage: null,
    });

    render(<EditReservationFormContainer reservationId={30} />);

    expect(
      screen.getByText("フォームの選択肢を読み込んでいます。"),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "予約を更新",
      }),
    ).not.toBeInTheDocument();
  });

  it("フォームの選択肢取得に失敗すると、エラーメッセージを表示する", () => {
    const reservation = createReservation({
      id: 30,
      reservation_name: "山田 太郎",
      reservation_phone_number: "09012345678",
      starts_at: "2026-09-08T18:00:00+09:00",
      ends_at: "2026-09-08T20:00:00+09:00",
      guest_count: 3,
      requested_restaurant_master_type_id: 1,
      reservation_status_id: 1,
      lock_version: 4,
    });

    mocks.useReservation.mockReturnValue({
      reservation,
      isLoading: false,
      errorMessage: null,
    });

    mocks.useReservationFormOptions.mockReturnValue({
      requestedRestaurantMasterTypes: [],
      reservationRoutes: [],
      menuTypes: [],
      reservationOccasions: [],
      reservationStatuses: [],
      restaurantMasters: [],
      isLoading: false,
      errorMessage: "フォームの選択肢を取得できませんでした。",
    });

    render(<EditReservationFormContainer reservationId={30} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "フォームの選択肢を取得できませんでした。",
    );

    expect(
      screen.queryByRole("button", {
        name: "予約を更新",
      }),
    ).not.toBeInTheDocument();
  });
});
