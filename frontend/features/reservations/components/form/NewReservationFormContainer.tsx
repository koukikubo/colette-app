"use client";
import { useState, useEffect } from "react";

import { fetchStandardCodes } from "@/features/standard-codes/api/standard-code-api";
import type { StandardCode } from "@/features/standard-codes/types";

import type { ReservationFormValues } from "../../types";
import {
  buildNewReservationFormValues,
  buildCreateReservationRequest,
} from "../../utils/reservation-form";
import { ReservationForm } from "./ReservationForm";
import { createReservation } from "../../api/reservation_api";
import { ApiClientError } from "@/lib/api/api-client";

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
  const [standardCodes, setStandardCodes] = useState<StandardCode[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useEffect(() => {
    // 全体を非同期関数にせずにloadStandardCodesだけを非同期に変更
    async function loadStandardCodes() {
      // 次に基本コードマスタ取得APIを呼び出す
      const response = await fetchStandardCodes();

      setStandardCodes(response.data.standard_masters);
    }

    void loadStandardCodes();
  }, []);

  // standardCodes から system_key が restaurant_master_typeを探す
  const requestedRestaurantMasterTypes =
    // 見つかったアイテムを取得する。なければ空を返す。
    standardCodes.find(
      (standardCode) => standardCode.system_key === "restaurant_master_type",
    )?.items ?? [];

  const reservationRoutes =
    standardCodes.find(
      (standardCode) => standardCode.system_key === "reservation_route",
    )?.items ?? [];

  const menuTypes =
    standardCodes.find(
      (standardCode) => standardCode.system_key === "reservation_menu_type",
    )?.items ?? [];
  const reservationOccasion =
    standardCodes.find(
      (standardCode) => standardCode.system_key === "reservation_occasion",
    )?.items ?? [];

  // 予約登録APIを呼び出す
  async function handleSubmit() {
    setErrorMessage(null);
    try {
      const request = buildCreateReservationRequest(values);

      const response = await createReservation(request);
      console.log(response);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
        return;
      }
      // 失敗したらエラーメッセージを表示する
      setErrorMessage("予約の登録中に予期しないエラーが発生しました。");
    }
  }
  // 入力値と変更用の関数をReservationFormへ渡す
  return (
    <ReservationForm
      values={values}
      onChange={setValues}
      requestedRestaurantMasterTypes={requestedRestaurantMasterTypes}
      reservationRoutes={reservationRoutes}
      menuTypes={menuTypes}
      reservationOccasion={reservationOccasion}
      onSubmit={handleSubmit}
      errorMessage={errorMessage}
    />
  );
}

// 成功したら対象日の予約一覧へ戻る （未実装）
