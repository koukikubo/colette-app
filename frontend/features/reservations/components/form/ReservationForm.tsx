// 状態管理やAPI通信はこのファイルでは行わない
import type { Customer } from "@/features/customers/types";
import type { ReservationFormValues } from "../../types";
import type { StandardListCode } from "@/features/standard-codes/types";

import { CustomerKeywordSearch } from "@/features/customers/components/CustomerKeywordSearch";
import { Input } from "@/components/ui/input";
import { ApiFieldErrors } from "@/lib/api/api-client";

// 親コンポーネントから受け取るデータの形を定義する
type ReservationFormProps = {
  // 現在のフォーム入力値
  values: ReservationFormValues;
  // 入力内容を変更するときに親コンポーネントから受け取る関数
  onChange: (newValues: ReservationFormValues) => void;
  requestedRestaurantMasterTypes: StandardListCode[];
  reservationRoutes: StandardListCode[];
  menuTypes: StandardListCode[];
  reservationOccasion: StandardListCode[];
  reservationStatuses: StandardListCode[];
  onSubmit: () => void;

  errorMessage: string | null;
  isSubmitting: boolean;
  customerQuery: string;
  customers: Customer[];
  isCustomerSearching: boolean;
  customerSearchError: string | null;
  onCustomerQueryChange: (value: string) => void;
  onCustomerSearch: () => void;
  onCustomerSelect: (customer: Customer) => void;
  hasSearchedCustomers: boolean;
  fieldErrors: ApiFieldErrors;
  onClearFieldError: (fieldName: string) => void;
};

export function ReservationForm({
  values,
  onChange,
  requestedRestaurantMasterTypes,
  reservationRoutes,
  menuTypes,
  reservationOccasion,
  reservationStatuses,
  onSubmit,
  errorMessage,
  isSubmitting,
  customerQuery,
  customers,
  isCustomerSearching,
  customerSearchError,
  onCustomerQueryChange,
  onCustomerSearch,
  onCustomerSelect,
  hasSearchedCustomers,
  fieldErrors,
  onClearFieldError,
}: ReservationFormProps) {
  return (
    // このコンポーネントは予約フォームの入力欄を表示する
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <CustomerKeywordSearch
        value={customerQuery}
        isLoading={isCustomerSearching}
        placeholder="氏名・カナ・電話番号で検索"
        onValueChange={onCustomerQueryChange}
        onSearch={onCustomerSearch}
      />
      {customerSearchError && (
        <p className="text-sm text-destructive">{customerSearchError}</p>
      )}
      {hasSearchedCustomers &&
        !isCustomerSearching &&
        customers.length === 0 &&
        !customerSearchError && (
          <p className="text-sm text-muted-foreground">
            該当する顧客が見つかりませんでした。
          </p>
        )}

      {customers.length > 0 && (
        <ul className="rounded-md border">
          {customers.map((customer) => (
            <li key={customer.id} className="border-b last:border-b-0">
              <button
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-muted"
                onClick={() => onCustomerSelect(customer)}
              >
                <span>{customer.name}</span>
                {customer.phone_number && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    （{customer.phone_number}）
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      {errorMessage && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      {/* まずは予約者名の入力欄だけ作る */}
      <label htmlFor="reservation-name">予約者名</label>
      <Input
        // 親が管理している現在の予約者名を表示する
        id="reservation-name"
        name="reservation_name"
        value={values.reservation_name}
        onChange={(e) => {
          onClearFieldError("reservation_name");
          onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...values,

            // 予約者名だけを新しい入力内容へ変更する
            reservation_name: e.target.value,
          });
        }}
      />
      {fieldErrors.reservation_name?.map((message) => (
        <p key={message} className="mt-1 text-sm text-destructive">
          {message}
        </p>
      ))}
      {/* 予約者の電話番号を入力する */}
      <label htmlFor="reservation-phone-number">電話番号</label>
      <input
        // 親が管理している現在の電話番号を表示する
        id="reservation-phone-number"
        name="reservation_phone_number"
        type="tel"
        value={values.reservation_phone_number}
        onChange={(e) => {
          onClearFieldError("reservation_phone_number");
          onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...values,

            // 電話番号だけを新しい入力内容へ変更する
            reservation_phone_number: e.target.value,
          });
        }}
      />
      {fieldErrors.reservation_phone_number?.map((message) => (
        <p key={message} className="mt-1 text-sm text-destructive">
          {message}
        </p>
      ))}
      {/* 予約の開始日時を入力する */}
      <label htmlFor="starts_at">予約開始日時</label>
      <input
        // 親が管理している現在の予約開始時刻を表示する
        id="starts_at"
        name="starts_at"
        type="datetime-local"
        value={values.starts_at}
        onChange={(e) => {
          onClearFieldError("starts_at");
          onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...values,

            // 予約開始時刻だけを新しい入力内容へ変更する
            starts_at: e.target.value,
          });
        }}
      />
      {fieldErrors.starts_at?.map((message) => (
        <p key={message} className="mt-1 text-sm text-destructive">
          {message}
        </p>
      ))}
      {/* 予約の終了日時を入力する */}
      <label htmlFor="ends_at">予約終了日時</label>
      <input
        // 親が管理している現在の予約終了時刻を表示する
        id="ends_at"
        name="ends_at"
        type="datetime-local"
        value={values.ends_at}
        onChange={(e) => {
          onClearFieldError("ends_at");
          onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...values,

            // 予約終了時刻だけを新しい入力内容へ変更する
            ends_at: e.target.value,
          });
        }}
      />
      {fieldErrors.ends_at?.map((message) => (
        <p key={message} className="mt-1 text-sm text-destructive">
          {message}
        </p>
      ))}
      {/* 予約人数を入力する */}
      <label htmlFor="guest_count">人数</label>
      <input
        // 親が管理している現在の予約人数を表示する
        id="guest_count"
        name="guest_count"
        type="number"
        min={1}
        step={1}
        value={values.guest_count}
        onChange={(e) => {
          onClearFieldError("guest_count");
          onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...values,

            // 予約人数だけを新しい入力内容へ変更する
            guest_count: Number(e.target.value),
          });
        }}
      />

      {fieldErrors.guest_count?.map((message) => (
        <p key={message} className="mt-1 text-sm text-destructive">
          {message}
        </p>
      ))}

      {/* 希望席種を選択する */}
      <label htmlFor="requested_restaurant_master_type_id">希望席種</label>
      <select
        id="requested_restaurant_master_type_id"
        name="requested_restaurant_master_type_id"
        value={values.requested_restaurant_master_type_id ?? ""}
        onChange={(e) => {
          onChange({
            ...values,
            requested_restaurant_master_type_id:
              // optionのvalueはHTML上で文字列になるためnumberに変換。
              e.target.value === "" ? null : Number(e.target.value),
          });
        }}
      >
        <option value="">選択してください</option>
        {requestedRestaurantMasterTypes.map((mT) => (
          <option key={mT.id} value={mT.id}>
            {mT.label}
          </option>
        ))}
      </select>

      {fieldErrors.requested_restaurant_master_type?.map((message) => (
        <p key={message} className="mt-1 text-sm text-destructive">
          {message}
        </p>
      ))}

      {/* 予約経路を選択する */}
      <label htmlFor="reservation_route_id">予約経路</label>
      <select
        id="reservation_route_id"
        name="reservation_route_id"
        value={values.reservation_route_id ?? ""}
        onChange={(e) => {
          onChange({
            ...values,
            reservation_route_id:
              // optionのvalueはHTML上で文字列になるためnumberに変換。
              e.target.value === "" ? null : Number(e.target.value),
          });
        }}
      >
        <option value="">選択してください</option>

        {reservationRoutes.map((rR) => (
          <option key={rR.id} value={rR.id}>
            {rR.label}
          </option>
        ))}
      </select>
      {/* メニュータイプを選択する */}
      <label htmlFor="menu_type_id">メニュー</label>

      <select
        id="menu_type_id"
        name="menu_type_id"
        value={values.menu_type_id ?? ""}
        onChange={(e) => {
          onChange({
            ...values,
            menu_type_id:
              // optionのvalueはHTML上で文字列になるためnumberに変換。
              e.target.value === "" ? null : Number(e.target.value),
          });
        }}
      >
        <option value="">選択してください</option>

        {menuTypes.map((mT) => (
          <option key={mT.id} value={mT.id}>
            {mT.label}
          </option>
        ))}
      </select>
      {/* 利用目的を選択する */}
      <label htmlFor="occasion_id">利用目的</label>

      <select
        id="occasion_id"
        name="occasion_id"
        value={values.occasion_id ?? ""}
        onChange={(e) => {
          onClearFieldError("occasion");
          onChange({
            ...values,
            occasion_id:
              // optionのvalueはHTML上で文字列になるためnumberに変換。
              e.target.value === "" ? null : Number(e.target.value),
          });
        }}
      >
        <option value="">選択してください</option>

        {reservationOccasion.map((rO) => (
          <option key={rO.id} value={rO.id}>
            {rO.label}
          </option>
        ))}
      </select>

      <label htmlFor="reservation_status_id">予約状況</label>
      <select
        id="reservation_status_id"
        name="reservation_status_id"
        value={values.reservation_status_id ?? ""}
        onChange={(e) => {
          onClearFieldError("reservation_status");

          onChange({
            ...values,
            reservation_status_id:
              // optionのvalueはHTML上で文字列になるためnumberに変換。
              e.target.value === "" ? null : Number(e.target.value),
          });
        }}
      >
        <option value="">選択してください</option>

        {reservationStatuses.map((rS) => (
          <option key={rS.id} value={rS.id}>
            {rS.label}
          </option>
        ))}
      </select>

      {fieldErrors.reservation_status?.map((message) => (
        <p key={message} className="mt-1 text-sm text-destructive">
          {message}
        </p>
      ))}

      <label htmlFor="allergy_note">アレルギー</label>

      <textarea
        id="allergy_note"
        name="allergy_note"
        value={values.allergy_note}
        onChange={(e) => {
          onChange({
            ...values,
            allergy_note: e.target.value,
          });
        }}
      />

      <label htmlFor="disliked_food_note">苦手食材</label>

      <textarea
        id="disliked_food_note"
        name="disliked_food_note"
        value={values.disliked_food_note}
        onChange={(e) => {
          onChange({
            ...values,
            disliked_food_note: e.target.value,
          });
        }}
      />

      <label htmlFor="preferred_food_note">希望食材</label>

      <textarea
        id="preferred_food_note"
        name="preferred_food_note"
        value={values.preferred_food_note}
        onChange={(e) => {
          onChange({
            ...values,
            preferred_food_note: e.target.value,
          });
        }}
      />

      <label htmlFor="favorite_drink_note">好きなドリンク</label>

      <textarea
        id="favorite_drink_note"
        name="favorite_drink_note"
        value={values.favorite_drink_note}
        onChange={(e) => {
          onChange({
            ...values,
            favorite_drink_note: e.target.value,
          });
        }}
      />

      <label htmlFor="request_note">お客様からの要望</label>

      <textarea
        id="request_note"
        name="request_note"
        value={values.request_note}
        onChange={(e) => {
          onChange({
            ...values,
            request_note: e.target.value,
          });
        }}
      />

      <label htmlFor="internal_memo">店舗メモ</label>

      <textarea
        id="internal_memo"
        name="internal_memo"
        value={values.internal_memo}
        onChange={(e) => {
          onChange({
            ...values,
            internal_memo: e.target.value,
          });
        }}
      />

      <button type="submit" disabled={isSubmitting}>
        {" "}
        {isSubmitting ? "登録中…" : "登録する"}
      </button>
    </form>
  );
}
