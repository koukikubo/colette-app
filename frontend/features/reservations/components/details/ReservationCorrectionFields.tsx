"use client";

import { useState } from "react";
import { useCustomerSearch } from "@/features/customers/hooks/useCustomerSearch";
import { CustomerKeywordSearch } from "@/features/customers/components/search/CustomerKeywordSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Reservation, ReservationStatusActionRequest } from "../../types";
import { formatReservationDateTimeLocal } from "../../utils/reservation-date";

export type BookingCorrection = NonNullable<
  ReservationStatusActionRequest["reservation"]["booking"]
>;

// 実績に影響する予約情報は通常編集と分け、来店結果・理由と一度に確定する。
export function ReservationCorrectionFields({
  reservation,
  value,
  onChange,
  disabled,
}: {
  reservation: Reservation;
  value: BookingCorrection;
  onChange: (value: BookingCorrection) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState("");
  const [name, setName] = useState(reservation.customer?.name ?? "顧客未指定");
  const search = useCustomerSearch();
  const prefix = `booking-correction-${reservation.id}`;
  return (
    <fieldset
      disabled={disabled}
      className="space-y-3 rounded-md bg-muted/40 p-3"
    >
      <legend className="text-sm font-medium">予約情報の訂正</legend>
      <p className="text-sm">顧客：{name}</p>
      <CustomerKeywordSearch
        value={query}
        onValueChange={setQuery}
        isLoading={disabled || search.isSearching}
        onSearch={() => {
          if (!disabled && query.trim())
            void search.searchCustomers({
              query: query.trim(),
              per_page: 10,
            });
        }}
      />
      {search.errorMessage && <p role="alert">{search.errorMessage}</p>}
      <ul className="max-h-32 overflow-y-auto">
        {search.customers.map((customer) => (
          <li key={customer.id}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onChange({ ...value, customer_id: customer.id });
                setName(customer.name);
                search.clearCustomers();
              }}
            >
              {customer.name}を選択
            </Button>
          </li>
        ))}
      </ul>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          onChange({ ...value, customer_id: null });
          setName("顧客未指定");
        }}
      >
        顧客の紐付けを解除
      </Button>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${prefix}-start`}>予約開始予定</Label>
          <Input
            id={`${prefix}-start`}
            type="datetime-local"
            value={
              value.starts_at === ""
                ? ""
                : formatReservationDateTimeLocal(
                    value.starts_at ?? reservation.starts_at,
                  )
            }
            onChange={(event) =>
              onChange({
                ...value,
                starts_at: event.target.value
                  ? `${event.target.value}:00+09:00`
                  : "",
              })
            }
          />
        </div>
        <div>
          <Label htmlFor={`${prefix}-end`}>予約終了予定</Label>
          <Input
            id={`${prefix}-end`}
            type="datetime-local"
            value={
              value.ends_at === ""
                ? ""
                : formatReservationDateTimeLocal(
                    value.ends_at ?? reservation.ends_at,
                  )
            }
            onChange={(event) =>
              onChange({
                ...value,
                ends_at: event.target.value
                  ? `${event.target.value}:00+09:00`
                  : "",
              })
            }
          />
        </div>
      </div>
      <Label htmlFor={`${prefix}-guests`}>予約人数</Label>
      <Input
        id={`${prefix}-guests`}
        type="number"
        min={1}
        step={1}
        value={value.guest_count ?? reservation.guest_count}
        onChange={(event) =>
          onChange({ ...value, guest_count: Number(event.target.value) })
        }
      />
      <p className="text-xs text-muted-foreground">
        未来へ変更する場合は「未退店に戻す」を選択してください。席は現在の割当で再検証します。
      </p>
    </fieldset>
  );
}
