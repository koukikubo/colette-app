import type { ApiSuccessResponse } from "@/lib/api/api-client";

export type ReservationCustomer = {
  id: number;
  name: string;
  kana: string | null;
  phone_number: string | null;
  email: string | null;
  customer_kind: string;
  company_name: string | null;
};

export type ReservationStandardListMaster = {
  id: number;
  code: string;
  label: string;
};

export type ReservationRestaurantMaster = {
  id: number;
  code: string;
  name: string;
  capacity: number;
  active: boolean;
};

// 現段階の一覧画面では担当者情報を使用しないため、
// 詳細な型は担当者表示を実装する際に確定する。
export type ReservationStaff = Record<string, unknown>;

export type Reservation = {
  id: number;

  reservation_name: string;
  customer_id: number | null;
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

export type ReservationListParams = {
  date?: string;
};

export type ReservationListData = {
  reservations: Reservation[];
};

export type ReservationListResponse = ApiSuccessResponse<ReservationListData>;
