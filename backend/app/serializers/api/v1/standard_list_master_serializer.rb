module Api
  module V1
    class StandardListMasterSerializer < ApplicationSerializer

      def as_json
        {
          id: resource.id,
          display_code: resource.id.to_s.rjust(5, "0"),
          label: resource.label,
          description: resource.description,
          position: resource.position,
          active: resource.active
        }
      end
    end
  end
end
