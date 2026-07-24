// 状態管理やAPI通信はこのファイルでは行わない
import type { ReservationFormValues } from "../../types";
// 親コンポーネントから受け取るデータの形を定義する
type ReservationFormProps = {
  // 現在のフォーム入力値
  values: ReservationFormValues;
  // 入力内容を変更するときに親コンポーネントから受け取る関数
  onChange: (newValues: ReservationFormValues) => void;
};

export function ReservationForm(props: ReservationFormProps) {
  return (
    // このコンポーネントは予約フォームの入力欄を表示する
    <form>
      {/* まずは予約者名の入力欄だけ作る */}
      <label>予約者名</label>
      <input
        // 親が管理している現在の予約者名を表示する
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
    </form>
  );
}
