module Api
  module V1
    class StaffMasterSerializer < ApplicationSerializer
      # RailsからNext.jsに送るJSONの形式を定義する
      def as_json(*)
        {
          id: resource.id,
          code: resource.code,
          name: resource.name,
          role_code: resource.role_code,
          employment_started_on: resource.employment_started_on,
          retired_on: resource.retired_on,
          active: resource.active?,
          memo: resource.memo,
          staff: serialize_staff
        }
      end

      private

      def serialize_staff
        staff = resource.staff
        return nil if staff.nil?

        {
          id: staff.id,
          login_enabled: staff.login_enabled,
          failed_attempts: staff.failed_attempts,
          last_logged_in_at: staff.last_logged_in_at,
          locked: staff.locked?,
          locked_at: staff.locked_at,
        }
      end
    end
  end
end