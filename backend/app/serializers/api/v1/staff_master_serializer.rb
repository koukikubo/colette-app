module Api
  module V1
    class StaffMasterSerializer < ApplicationSerializer
      # RailsからNext.jsに送るJSONの形式を定義する
      def as_json
        {
          id: resource.id,
          code: resource.code,
          name: resource.name,
          role_code: resource.role_code,
          employment_started_on: resource.employment_started_on,
          retired_on: resource.retired_on,
          memo: resource.memo
        }
      end
    end
  end
end