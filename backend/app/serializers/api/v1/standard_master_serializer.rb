module Api
  module V1
    class StandardMasterSerializer < ApplicationSerializer

      def as_json
        {
          id: resource.id,
          display_code: resource.id.to_s.rjust(5, "0"),
          name: resource.name,
          description: resource.description,
          active: resource.active,
          position: resource.position,
          items: resource.standard_list_masters.ordered.map do |item|
            Api::V1::StandardListMasterSerializer.new(item).as_json
          end
        }
      end
    end
  end
end

