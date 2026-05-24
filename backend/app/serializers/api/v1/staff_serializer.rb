module Api
  module V1
    class StaffSerializer < ApplicationSerializer
      # RailsからNext.jsに送るJSONの形式を定義する（password除外）
      def as_json
        {
          id: record.id,
          staff_master: Api::V1::StaffMasterSerializer.new(record.staff_master).as_json,
          login_enabled: record.login_enabled,
          failed_attempts: record.failed_attempts,
          last_logged_in_at: record.last_logged_in_at
        }
      end
    end
  end
end
