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
    </form>
  );
}
