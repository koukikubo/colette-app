// 状態管理やAPI通信はこのファイルでは行わない
import type { ReservationFormValues } from "../../types";
import type { StandardListCode } from "@/features/standard-codes/types";

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
};

export function ReservationForm(props: ReservationFormProps) {
  return (
    // このコンポーネントは予約フォームの入力欄を表示する
    <form>
      {/* まずは予約者名の入力欄だけ作る */}
      <label htmlFor="reservation-name">予約者名</label>
      <input
        // 親が管理している現在の予約者名を表示する
        id="reservation-name"
        name="reservation_name"
        value={props.values.reservation_name}
        onChange={(e) => {
          props.onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...props.values,

            // 予約者名だけを新しい入力内容へ変更する
            reservation_name: e.target.value,
          });
        }}
      />
      {/* 予約者の電話番号を入力する */}
      <label htmlFor="reservation-phone-number">電話番号</label>
      <input
        // 親が管理している現在の電話番号を表示する
        id="reservation-phone-number"
        name="reservation_phone_number"
        type="tel"
        value={props.values.reservation_phone_number}
        onChange={(e) => {
          props.onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...props.values,

            // 電話番号だけを新しい入力内容へ変更する
            reservation_phone_number: e.target.value,
          });
        }}
      />
      {/* 予約の開始日時を入力する */}
      <label htmlFor="starts_at">予約開始日時</label>
      <input
        // 親が管理している現在の予約開始時刻を表示する
        id="starts_at"
        name="starts_at"
        type="datetime-local"
        value={props.values.starts_at}
        onChange={(e) => {
          props.onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...props.values,

            // 予約開始時刻だけを新しい入力内容へ変更する
            starts_at: e.target.value,
          });
        }}
      />
      {/* 予約の終了日時を入力する */}
      <label htmlFor="ends_at">予約終了日時</label>
      <input
        // 親が管理している現在の予約終了時刻を表示する
        id="ends_at"
        name="ends_at"
        type="datetime-local"
        value={props.values.ends_at}
        onChange={(e) => {
          props.onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...props.values,

            // 予約終了時刻だけを新しい入力内容へ変更する
            ends_at: e.target.value,
          });
        }}
      />
      {/* 予約人数を入力する */}
      <label htmlFor="guest_count">人数</label>
      <input
        // 親が管理している現在の予約人数を表示する
        id="guest_count"
        name="guest_count"
        type="number"
        min={1}
        step={1}
        value={props.values.guest_count}
        onChange={(e) => {
          props.onChange({
            // フォームの現在値は親コンポーネントから受け取る
            ...props.values,

            // 予約人数だけを新しい入力内容へ変更する
            guest_count: Number(e.target.value),
          });
        }}
      />
      {/* 希望席種を選択する */}
      <label htmlFor="requested_restaurant_master_type_id">希望席種</label>

      <select
        id="requested_restaurant_master_type_id"
        name="requested_restaurant_master_type_id"
        value={props.values.requested_restaurant_master_type_id ?? ""}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            requested_restaurant_master_type_id:
              // optionのvalueはHTML上で文字列になるためnumberに変換。
              e.target.value === "" ? null : Number(e.target.value),
          });
        }}
      >
        <option value="">選択してください</option>

        {props.requestedRestaurantMasterTypes.map((mT) => (
          <option key={mT.id} value={mT.id}>
            {mT.label}
          </option>
        ))}
      </select>

      {/* 予約経路を選択する */}
      <label htmlFor="reservation_route_id">予約経路</label>

      <select
        id="reservation_route_id"
        name="reservation_route_id"
        value={props.values.reservation_route_id ?? ""}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            reservation_route_id:
              // optionのvalueはHTML上で文字列になるためnumberに変換。
              e.target.value === "" ? null : Number(e.target.value),
          });
        }}
      >
        <option value="">選択してください</option>

        {props.reservationRoutes.map((rR) => (
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
        value={props.values.menu_type_id ?? ""}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            menu_type_id:
              // optionのvalueはHTML上で文字列になるためnumberに変換。
              e.target.value === "" ? null : Number(e.target.value),
          });
        }}
      >
        <option value="">選択してください</option>

        {props.menuTypes.map((mT) => (
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
        value={props.values.occasion_id ?? ""}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            occasion_id:
              // optionのvalueはHTML上で文字列になるためnumberに変換。
              e.target.value === "" ? null : Number(e.target.value),
          });
        }}
      >
        <option value="">選択してください</option>

        {props.reservationOccasion.map((rO) => (
          <option key={rO.id} value={rO.id}>
            {rO.label}
          </option>
        ))}
      </select>

      <label htmlFor="allergy_note">アレルギー</label>

      <textarea
        id="allergy_note"
        name="allergy_note"
        value={props.values.allergy_note}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            allergy_note: e.target.value,
          });
        }}
      />

      <label htmlFor="disliked_food_note">苦手食材</label>

      <textarea
        id="disliked_food_note"
        name="disliked_food_note"
        value={props.values.disliked_food_note}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            disliked_food_note: e.target.value,
          });
        }}
      />

      <label htmlFor="preferred_food_note">希望食材</label>

      <textarea
        id="preferred_food_note"
        name="preferred_food_note"
        value={props.values.preferred_food_note}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            preferred_food_note: e.target.value,
          });
        }}
      />

      <label htmlFor="disliked_food_note">好きなドリンク</label>

      <textarea
        id="favorite_drink_note"
        name="favorite_drink_note"
        value={props.values.favorite_drink_note}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            favorite_drink_note: e.target.value,
          });
        }}
      />

      <label htmlFor="request_note">お客様からの要望</label>

      <textarea
        id="request_note"
        name="request_note"
        value={props.values.request_note}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            request_note: e.target.value,
          });
        }}
      />

      <label htmlFor="internal_memo">店舗メモ</label>

      <textarea
        id="internal_memo"
        name="internal_memo"
        value={props.values.internal_memo}
        onChange={(e) => {
          props.onChange({
            ...props.values,
            internal_memo: e.target.value,
          });
        }}
      />
    </form>
  );
}
