// Rails側APIに合わせる
import type { ApiSuccessResponse } from "@/lib/api/api-client";
// 予約に紐つく顧客情報
export type ReservationCustomer = {
  id: number;
  name: string;
  kana: string | null;
  phone_number: string | null;
  email: string | null;
  customer_kind: string;
  company_name: string | null;
};
// 基本コード情報
export type ReservationStandardListMaster = {
  id: number;
  code: string;
  label: string;
};
// 予約に割り与えられた席情報
export type ReservationRestaurantMaster = {
  id: number;
  code: string;
  restaurant_master_type_id: number;
  sequence_number: number;
  name: string;
  capacity: number;
  active: boolean;
};
// 予約登録APIへ送信するリクエスト
export type ReservationCreateRequest = {
  reservation: Reservation;
};
// 予約更新APIへ送信するリクエスト（楽観ロック含む）
export type ReservationUpdateAttributes = ReservationCreateAttributes & {
  lock_version: number;
};
// 予約更新APIへ送信するリクエスト
export type ReservationUpdateRequest = {
  reservation: ReservationUpdateAttributes;
};

// Railsから返ってくる登録済みの予約型
export type ReservationCreateAttributes = {
  customer_id: number | null;
  reservation_name: string;
  reservation_phone_number: string;

  starts_at: string;
  ends_at: string;
  guest_count: number;

  requested_restaurant_master_type_id: null;
  restaurant_master_ids: number[];

  reservation_route_id: number | null;
  menu_type_id: number | null;
  occasion_id: number | null;

  allergy_note: string | null;
  disliked_food_note: string | null;
  preferred_food_note: string | null;
  favorite_drink_note: string | null;
  request_note: string | null;
  internal_memo: string | null;
};

// Railsへ登録時に送る予約属性
export type ReservationAttributes = {
  customer_id: number | null;
  reservation_name: string;
  reservation_phone_number: string;

  starts_at: string;
  ends_at: string;
  guest_count: number;

  requested_restaurant_master_type_id: number;
  restaurant_master_ids: number[];

  reservation_route_id: number | null;
  menu_type_id: number | null;
  occasion_id: number | null;

  allergy_note: string | null;
  disliked_food_note: string | null;
  preferred_food_note: string | null;
  favorite_drink_note: string | null;
  request_note: string | null;
  internal_memo: string | null;
};

// 予約に紐つく担当者の方（現時点では未使用）
export type ReservationStaff = Record<string, unknown>;

// 予約フォームで扱う値（登録・編集）
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
  requested_restaurant_master_type_id: number | null;
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
};

// 予約更新APIへ送信するリクエスト
export type ReservationUpdateRequest = {
  reservation: ReservationUpdateAttributes;
};

// フォームで入力中の値
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
  requested_restaurant_master_type_id: null;
  restaurant_master_ids: number[];

  reservation_route_id: number | null;
  menu_type_id: number | null;
  occasion_id: number | null;

  // inputやtextareaでは文字列として扱う
  allergy_note: string;
  disliked_food_note: string;
  preferred_food_note: string;
  favorite_drink_note: string;
  request_note: string;
  internal_memo: string;
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

// 予約1件取得・登録・更新APIのdata部分
export type ReservationData = {
  reservations: Reservation[];
};

// 予約詳細・登録・更新APIのdata部分
export type ReservationData = {
  reservation: Reservation;
};

// 予約一覧API全体のレスポンス
export type ReservationListResponse = ApiSuccessResponse<ReservationListData>;
