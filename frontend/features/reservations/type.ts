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

// 予約に割り当てられた席情報
export type ReservationRestaurantMaster = {
  id: number;
  code: string;
  restaurant_master_type_id: number;
  sequence_number: number;
  name: string;
  capacity: number;
  active: boolean;
};

// 予約に紐つく担当者情報（表示項目の実装時に詳細化する）
export type ReservationStaff = Record<string, unknown>;

// RailsのSerializerから返ってくる登録済み予約
export type Reservation = {
  id: number;

  customer_id: number | null;
  reservation_name: string;
  customer: ReservationCustomer | null;
  reservation_phone_number: string;

  starts_at: string;
  ends_at: string;
  guest_count: number;

  requested_restaurant_master_type_id: number;
  requested_restaurant_master_type: ReservationStandardListMaster | null;

  restaurant_master_ids: number[];
  restaurant_masters: ReservationRestaurantMaster[];

  reservation_status_id: number;
  reservation_status: ReservationStandardListMaster | null;

  reservation_route_id: number | null;
  reservation_route: ReservationStandardListMaster | null;

  menu_type_id: number | null;
  menu_type: ReservationStandardListMaster | null;

  occasion_id: number | null;
  occasion: ReservationStandardListMaster | null;

  allergy_note: string | null;
  disliked_food_note: string | null;
  preferred_food_note: string | null;
  favorite_drink_note: string | null;
  request_note: string | null;
  internal_memo: string | null;

  details_confirmed_at: string | null;
  canceled_at: string | null;

  lock_version: number;

  created_by_staff: ReservationStaff;
  updated_by_staff: ReservationStaff;

  created_at: string;
  updated_at: string;
};

// 予約フォームで扱う値（登録・編集共通）
export type ReservationFormValues = {
  customer_id: number | null;
  reservation_name: string;
  reservation_phone_number: string;

  starts_at: string;
  ends_at: string;
  guest_count: number;

  requested_restaurant_master_type_id: number | null;
  restaurant_master_ids: number[];

  reservation_route_id: number | null;
  menu_type_id: number | null;
  occasion_id: number | null;

  allergy_note: string;
  disliked_food_note: string;
  preferred_food_note: string;
  favorite_drink_note: string;
  request_note: string;
  internal_memo: string;
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

// 予約登録APIへ送信するリクエスト
export type ReservationCreateRequest = {
  reservation: ReservationAttributes;
};

// 予約更新APIへ送信する属性（楽観ロック含む）
export type ReservationUpdateAttributes = Partial<ReservationAttributes> & {
  lock_version: number;
};

// 予約更新APIへ送信するリクエスト
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

// 予約詳細・登録・更新APIのdata部分
export type ReservationData = {
  reservation: Reservation;
};

// 予約一覧API全体のレスポンス
export type ReservationListResponse =
  ApiSuccessResponse<ReservationListData>;

// 予約詳細・登録・更新API全体のレスポンス
export type ReservationResponse = ApiSuccessResponse<ReservationData>;
