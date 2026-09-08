import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReservationTableSelector } from "../../../components/form/ReservationTableSelector";

describe("ReservationTableSelector", () => {
  it("テーブルを選択すると、選択したテーブルIDを通知する", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const restaurantMaster = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    render(
      <ReservationTableSelector
        restaurantMasters={[restaurantMaster]}
        selectedIds={[]}
        guestCount={2}
        unavailableRestaurantMasterIds={[]}
        isAvailabilityLoading={false}
        availabilityErrorMessage={null}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("選択 0卓")).toBeInTheDocument();
    expect(screen.getByText("合計定員 0名")).toBeInTheDocument();

    await user.click(
      screen.getByRole("checkbox", {
        name: /カウンター1/,
      }),
    );

    expect(onChange).toHaveBeenCalledWith([10]);
  });

  it("選択中の合計定員が予約人数より少ない場合、警告を表示する", () => {
    const counter1 = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    const counter2 = {
      ...counter1,
      id: 11,
      sequence_number: 2,
      code: "C02",
      name: "カウンター2",
      capacity: 1,
    };

    render(
      <ReservationTableSelector
        restaurantMasters={[counter1, counter2]}
        selectedIds={[10, 11]}
        guestCount={4}
        unavailableRestaurantMasterIds={[]}
        isAvailabilityLoading={false}
        availabilityErrorMessage={null}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("選択 2卓")).toBeInTheDocument();
    expect(screen.getByText("合計定員 3名")).toBeInTheDocument();

    expect(
      screen.getByRole("checkbox", {
        name: /カウンター1/,
      }),
    ).toBeChecked();

    expect(
      screen.getByRole("checkbox", {
        name: /カウンター2/,
      }),
    ).toBeChecked();

    expect(screen.getByRole("status")).toHaveTextContent(
      "予約人数に対して定員が不足しています。テーブルを追加してください。",
    );
  });

  it("選択済みのテーブルを解除すると、そのIDを除いて通知する", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const counter1 = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    const counter2 = {
      ...counter1,
      id: 11,
      sequence_number: 2,
      code: "C02",
      name: "カウンター2",
    };

    render(
      <ReservationTableSelector
        restaurantMasters={[counter1, counter2]}
        selectedIds={[10, 11]}
        guestCount={2}
        unavailableRestaurantMasterIds={[]}
        isAvailabilityLoading={false}
        availabilityErrorMessage={null}
        onChange={onChange}
      />,
    );

    await user.click(
      screen.getByRole("checkbox", {
        name: /カウンター1/,
      }),
    );

    expect(onChange).toHaveBeenCalledWith([11]);
  });

  it("予約済みのテーブルは選択できない", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const counter1 = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    render(
      <ReservationTableSelector
        restaurantMasters={[counter1]}
        selectedIds={[]}
        guestCount={2}
        unavailableRestaurantMasterIds={[10]}
        isAvailabilityLoading={false}
        availabilityErrorMessage={null}
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /カウンター1/,
    });

    expect(checkbox).toBeDisabled();
    expect(screen.getByText("予約済み")).toBeInTheDocument();

    await user.click(checkbox);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("選択済みのテーブルは、予約済み判定でも解除できる", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const counter1 = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    render(
      <ReservationTableSelector
        restaurantMasters={[counter1]}
        selectedIds={[10]}
        guestCount={2}
        unavailableRestaurantMasterIds={[10]}
        isAvailabilityLoading={false}
        availabilityErrorMessage={null}
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /カウンター1/,
    });

    expect(checkbox).toBeChecked();
    expect(checkbox).not.toBeDisabled();
    expect(screen.getByText("予約済み")).toBeInTheDocument();

    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("無効なテーブルは新規選択できないが、選択済みなら解除できる", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const inactiveCounter = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: false,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    const { rerender } = render(
      <ReservationTableSelector
        restaurantMasters={[inactiveCounter]}
        selectedIds={[]}
        guestCount={2}
        unavailableRestaurantMasterIds={[]}
        isAvailabilityLoading={false}
        availabilityErrorMessage={null}
        onChange={onChange}
      />,
    );

    let checkbox = screen.getByRole("checkbox", {
      name: /カウンター1/,
    });

    expect(screen.getByText("無効")).toBeInTheDocument();
    expect(checkbox).toBeDisabled();

    await user.click(checkbox);

    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <ReservationTableSelector
        restaurantMasters={[inactiveCounter]}
        selectedIds={[10]}
        guestCount={2}
        unavailableRestaurantMasterIds={[]}
        isAvailabilityLoading={false}
        availabilityErrorMessage={null}
        onChange={onChange}
      />,
    );

    checkbox = screen.getByRole("checkbox", {
      name: /カウンター1/,
    });

    expect(checkbox).toBeChecked();
    expect(checkbox).not.toBeDisabled();

    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("空き状況の確認中は、未選択のテーブルを選択できない", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const counter1 = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    render(
      <ReservationTableSelector
        restaurantMasters={[counter1]}
        selectedIds={[]}
        guestCount={2}
        unavailableRestaurantMasterIds={[]}
        isAvailabilityLoading={true}
        availabilityErrorMessage={null}
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /カウンター1/,
    });

    expect(checkbox).toBeDisabled();

    expect(screen.getByRole("status")).toHaveTextContent(
      "実テーブルの空き状況を確認しています。",
    );

    await user.click(checkbox);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("空き状況の取得に失敗した場合、エラーを表示してテーブルを選択できない", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const counter1 = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    render(
      <ReservationTableSelector
        restaurantMasters={[counter1]}
        selectedIds={[]}
        guestCount={2}
        unavailableRestaurantMasterIds={[]}
        isAvailabilityLoading={false}
        availabilityErrorMessage="テーブルの空き状況を取得できませんでした。"
        onChange={onChange}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /カウンター1/,
    });

    expect(checkbox).toBeDisabled();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "テーブルの空き状況を取得できませんでした。",
    );

    await user.click(checkbox);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("席選択の入力エラーを表示する", () => {
    const counter1 = {
      id: 10,
      restaurant_master_type_id: 1,
      restaurant_master_type: {
        id: 1,
        code: "counter",
        label: "カウンター席",
      },
      sequence_number: 1,
      code: "C01",
      name: "カウンター1",
      capacity: 2,
      active: true,
      memo: null,
      lock_version: 0,
      created_by_staff: null,
      updated_by_staff: null,
      created_at: "2026-09-01T10:00:00+09:00",
      updated_at: "2026-09-01T10:00:00+09:00",
    };

    render(
      <ReservationTableSelector
        restaurantMasters={[counter1]}
        selectedIds={[]}
        guestCount={2}
        unavailableRestaurantMasterIds={[]}
        isAvailabilityLoading={false}
        availabilityErrorMessage={null}
        errorMessages={[
          "選択した席を利用できません。",
          "別の席を選択してください。",
        ]}
        onChange={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /カウンター1/,
    });

    expect(checkbox).toHaveAttribute("aria-invalid", "true");

    const alerts = screen.getAllByRole("alert");

    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveTextContent("選択した席を利用できません。");
    expect(alerts[1]).toHaveTextContent("別の席を選択してください。");
  });

  it("テーブルが存在しない場合、選択できるテーブルがないことを表示する", () => {
    render(
      <ReservationTableSelector
        restaurantMasters={[]}
        selectedIds={[]}
        guestCount={2}
        unavailableRestaurantMasterIds={[]}
        isAvailabilityLoading={false}
        availabilityErrorMessage={null}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText("選択できるテーブルがありません。"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("未割り当てのまま予約することもできます。"),
    ).toBeInTheDocument();

    expect(screen.getByText("選択 0卓")).toBeInTheDocument();
    expect(screen.getByText("合計定員 0名")).toBeInTheDocument();

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

});
