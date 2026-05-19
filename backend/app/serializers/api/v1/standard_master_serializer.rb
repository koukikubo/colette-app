module Api
  module V1
    class StandardMasterSerializer < ApplicationSerializer

      def as_json
        {
          id: @resource.id,
          code: @resource.code,
          name: @resource.name,
          description: @resource.description,
          active: @resource.active,
          position: @resource.position,
          items: @resource.standard_list_masters.ordered.map do |item|
            StandardListMasterSerializer.new(item).as_json
          end
        }
      end
    end
  end
end
