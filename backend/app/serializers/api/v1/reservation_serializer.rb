module Api
  module V1
    class ReservationSerializer < ApplicationSerializer
      def as_json(*)
        {
          id: resource.id,

          # 顧客・予約情報
          reservation_name: resource.reservation_name,
          customer_id: resource.customer_id,
          customer: serialize_customer(resource.customer),
          reservation_phone_number: resource.reservation_phone_number,

          # 予約日時・人数
          starts_at: resource.starts_at,
          ends_at: resource.ends_at,
          guest_count: resource.guest_count,

          # 希望席種
          requested_restaurant_master_type_id:
            resource.requested_restaurant_master_type_id,
          requested_restaurant_master_type:
            serialize_standard_list_master(
              resource.requested_restaurant_master_type
            ),

          # 実際に割り当てた席
          restaurant_master_ids:
            resource.restaurant_masters.map(&:id),
          restaurant_masters:
            resource.restaurant_masters.map do |restaurant_master|
              serialize_restaurant_master(restaurant_master)
            end,

          # 予約状態・基本コード
          reservation_status_id: resource.reservation_status_id,
          reservation_status:
            serialize_standard_list_master(
              resource.reservation_status
            ),

          reservation_route_id: resource.reservation_route_id,
          reservation_route:
            serialize_standard_list_master(
              resource.reservation_route
            ),

          menu_type_id: resource.menu_type_id,
          menu_type:
            serialize_standard_list_master(
              resource.menu_type
            ),

          occasion_id: resource.occasion_id,
          occasion:
            serialize_standard_list_master(
              resource.occasion
            ),
          
          # 予約詳細
          allergy_note: resource.allergy_note,
          disliked_food_note: resource.disliked_food_note,
          preferred_food_note: resource.preferred_food_note,
          favorite_drink_note: resource.favorite_drink_note,
          request_note: resource.request_note,
          internal_memo: resource.internal_memo,

          details_confirmed_at: resource.details_confirmed_at,
          canceled_at: resource.canceled_at,

          # 同時更新制御
          lock_version: resource.lock_version,

          # 登録・更新担当者
          created_by_staff:
            serialize_staff(resource.created_by_staff),
          updated_by_staff:
            serialize_staff(resource.updated_by_staff),

          created_at: resource.created_at,
          updated_at: resource.updated_at
        }
      end

      private
      def serialize_customer(customer)
        return nil if customer.blank?

        {
          id: customer.id,
          name: customer.name,
          kana: customer.kana,
          phone_number: customer.phone_number,
          email: customer.email,
          customer_kind: customer.customer_kind,
          company_name: customer.company_name
        }
      end

      def serialize_standard_list_master(standard_list_master)
        return nil if standard_list_master.blank?

        {
          id: standard_list_master.id,
          code: standard_list_master.code,
          label: standard_list_master.label
        }
      end

      def serialize_restaurant_master(restaurant_master)
        return nil if restaurant_master.blank?

        {
          id: restaurant_master.id,
          code: restaurant_master.code,
          name: restaurant_master.name,
          capacity: restaurant_master.capacity,
          active: restaurant_master.active
        }
      end
    end
  end
end