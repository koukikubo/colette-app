module Api
  module V1
    class StaffMasterSerializer < ApplicationSerializer
      # RailsからNext.jsに送るJSONの形式を定義する
      def as_json
        {
          id: record.id,
          code: record.code,
          name: record.name,
          role_code: record.role_code,
          employment_started_on: record.employment_started_on,
          retired_on: record.retired_on,
          memo: record.memo
        }
      end
    end
  end
end