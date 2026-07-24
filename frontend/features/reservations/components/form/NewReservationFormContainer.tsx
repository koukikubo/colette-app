"use client";
import { useState } from "react";

import type { ReservationFormValues } from "../../types";
import { buildNewReservationFormValues } from "../../utils/reservation-form";
import { ReservationForm } from "./ReservationForm";

// 新規登録Containerが親から受け取るデータ
type NewReservationFormContainerProps = {
  // 初期日時を作るための対象日
  targetDate: string;
};

// 新規予約フォームの入力値と登録処理を管理する
export function NewReservationFormContainer(
  props: NewReservationFormContainerProps,
) {
  const targetDate = props.targetDate;
  // 対象日から初期値を作り、入力中の値として管理する
  const [values, setValues] = useState<ReservationFormValues>(() => {
    return buildNewReservationFormValues({ targetDate });
  });
  // 入力値と変更用の関数をReservationFormへ渡す
  return <ReservationForm values={values} onChange={setValues} />;
}

// 登録ボタンが押されたらRails送信用データへ変換する
// 予約登録APIを呼び出す
// 成功したら対象日の予約一覧へ戻る
// 失敗したらエラーメッセージを表示する
