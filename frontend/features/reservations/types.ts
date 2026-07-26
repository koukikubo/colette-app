// Rails側APIに合わせる
import type { ApiSuccessResponse } from "@/lib/api/api-client";

// 予約レスポンスに含まれる（入子）顧客情報
export type ReservationCustomer = {
  id: number;
  name: string;
  kana: string | null;
  phone_number: string | null;
  email: string | null;
  customer_kind: string;
  company_name: string | null;
};
// 予約レスポンスに含まれる（入子）基本コード情報
export type ReservationStandardListMaster = {
  id: number;
  code: string;
  label: string;
};
// 予約レスポンスに含まれる割り与て席の情報
export type ReservationRestaurantMaster = {
  id: number;
  code: string;
  restaurant_master_type_id: number;
  sequence_number: number;
  name: string;
  capacity: number;
  active: boolean;
};

// 予約レスポンスに含まれる担当者情報
export type ReservationStaff = {
  id: number;
  staff_master_id: number;
  name: string | null;
};

// Railsから返ってくる登録済み予約
export type Reservation = {
  id: number;

  // 顧客・予約者情報
  customer_id: number | null;
  reservation_name: string;
  customer: ReservationCustomer | null;
  reservation_phone_number: string;

  // 予約時間・人数
  starts_at: string;
  ends_at: string;
  guest_count: string;

  // 希望席種
  requested_restaurant_master_type_id: number;
  requested_restaurant_master_type: ReservationStandardListMaster | null;

  // 実際に割り当てられた席
  restaurant_master_ids: number[];
  restaurant_masters: ReservationRestaurantMaster[];

  // 予約状態
  reservation_status_id: number;
  reservation_status: ReservationStandardListMaster | null;

  // 予約経路
  reservation_route_id: number | null;
  reservation_route: ReservationStandardListMaster | null;

  // メニュー種別
  menu_type_id: number | null;
  menu_type: ReservationStandardListMaster | null;

  // 利用目的
  occasion_id: number | null;
  occasion: ReservationStandardListMaster | null;

  // 予約詳細
  allergy_note: string | null;
  disliked_food_note: string | null;
  preferred_food_note: string | null;
  favorite_drink_note: string | null;
  request_note: string | null;
  internal_memo: string | null;

  // 詳細確認・キャンセル情報
  details_confirmed_at: string | null;
  canceled_at: string | null;

  // 楽観ロック
  lock_version: number;

  // 登録・更新担当者
  created_by_staff: ReservationStaff;
  updated_by_staff: ReservationStaff;

  // 登録・更新日時
  created_at: string;
  updated_at: string;
};

// 予約Form全体で使用する入力中の値
export type ReservationFormValues = {
  customer_id: number | null;
  reservation_name: string;
  reservation_phone_number: string;

  starts_at: string;
  ends_at: string;
  guest_count: number;

  // 入力中は未選択にできる
  requested_restaurant_master_type_id: number | null;
  restaurant_master_ids: number[];

  reservation_route_id: number | null;
  menu_type_id: number | null;
  occasion_id: number | null;

  // input・textareaで扱うためstring
  allergy_note: string;
  disliked_food_note: string;
  preferred_food_note: string;
  favorite_drink_note: string;
  request_note: string;
  internal_memo: string;
};

// Railsへ送信する予約属性
export type ReservationAttributes = {
  customer_id: number | null;
  reservation_name: string;
  reservation_phone_number: string;

  starts_at: string;
  ends_at: string;
  guest_count: number;

  // Railsへ送信する時は選択必須
  requested_restaurant_master_type_id: number | null;
  restaurant_master_ids: number[];

  reservation_route_id: number | null;
  menu_type_id: number | null;
  occasion_id: number | null;

  // inputやtextareaでは文字列として扱う
  allergy_note: string | null;
  disliked_food_note: string | null;
  preferred_food_note: string | null;
  favorite_drink_note: string | null;
  request_note: string | null;
  internal_memo: string | null;
};

// 予約登録APIへ送るリクエスト
export type ReservationCreateRequest = {
  reservation: ReservationAttributes;
};

// 予約更新APIへ送る属性
export type ReservationUpdateAttributes = Partial<ReservationAttributes> & {
  lock_version: number;
};

// 予約更新APIへ送るリクエスト
export type ReservationUpdateRequest = {
  reservation: ReservationUpdateAttributes;
};

// 予約一覧APIへ渡す検索条件
export type ReservationListParams = {
  date?: string;
};

// 予約一覧APIのdata部分
export type ReservationListData = {
  reservations: Reservation[];
};

// 予約1件取得・登録・更新APIのdata部分
export type ReservationData = {
  reservation: Reservation;
};

// 予約一覧API全体のレスポンス
export type ReservationListResponse = ApiSuccessResponse<ReservationListData>;

// 予約詳細・登録・更新API全体のレスポンス
export type ReservationResponse = ApiSuccessResponse<ReservationData>;
