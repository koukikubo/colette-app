module Api
  module V1
    class StaffSerializer < ApplicationSerializer
      # RailsからNext.jsに送るJSONの形式を定義する（password除外）
      def as_json
        {
          id: resource.id,
          staff_master: Api::V1::StaffMasterSerializer.new(resource.staff_master).as_json,
          login_enabled: resource.login_enabled,
          failed_attempts: resource.failed_attempts,
          last_logged_in_at: resource.last_logged_in_at
        }
      end
    end
  end
end
