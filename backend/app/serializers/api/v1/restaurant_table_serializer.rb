module Api
  module V1
      class RestaurantTableSerializer < ApplicationSerializer
        def as_json(*)
          {
            id: resource.id,

            # 席種
            restaurant_table_type_id: resource.restaurant_table_type_id,
            restaurant_table_type: 
              serialize_restaurant_table_type(
              resource.restaurant_table_type
            ),

            # 席情報
            sequence_number: resource.sequence_number,
            code: resource.code,
            name: resource.name,
            capacity: resource.capacity,
            active: resource.active,
            position: resource.position,
            memo: resource.memo,

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

        # 席種として必要な基本コード情報を返す。
        #
        # 既存のStandardListMasterSerializerを使用することで、
        # 基本コード選択肢のレスポンス形式を統一する。
        def serialize_restaurant_table_type(table_type)
          return nil if table_type.nil?

          {
            id: table_type.id,
            code: table_type.code,
            label: table_type.label
          }
        end

        # 登録者・更新者の表示に必要な情報だけを返す。
        #
        # StaffSerializerはログイン状態なども返すため、
        # 監査情報には使用しない。
        def serialize_staff(staff)
          return nil if staff.nil?

          {
            id: staff.id,
            code: staff.staff_master&.code,
            name: staff.staff_master&.name
          }
        end
      end
  end
end