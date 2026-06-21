module Api
  module V1
    class CustomerSerializer < ApplicationSerializer
      def as_json
        {
          id: resource.id,
          customer_kind: resource.customer_kind,
          name: resource.name,
          kana: resource.kana,
          postal_code: resource.postal_code,
          address: resource.address,
          phone_number: resource.phone_number,
          email: resource.email,
          birthday: resource.birthday,

          company_name: resource.company_name,
          company_name_kana: resource.company_name_kana,
          company_postal_code: resource.company_postal_code,
          company_address: resource.company_address,
          company_phone_number: resource.company_phone_number,
          company_email: resource.company_email,

          memo: resource.memo,

          hidden: resource.hidden_at.present?,
          hidden_at: resource.hidden_at,

          lock_version: resource.lock_version,

          created_by_staff: serialize_staff(resource.created_by_staff),
          updated_by_staff: serialize_staff(resource.updated_by_staff),

          created_at: resource.created_at,
          updated_at: resource.updated_at
        }
      end

      private

      # 顧客の登録者・更新者として必要な情報だけを返す。
      # StaffSerializerはログイン状態なども含むため、監査表示には使用しない。
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