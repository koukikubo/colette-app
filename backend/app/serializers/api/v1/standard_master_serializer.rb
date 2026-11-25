module Api
  module V1
    class StandardMasterSerializer < ApplicationSerializer
      def as_json
        {
          id: resource.id,
          system_key: resource.system_key,
          display_code: resource.id.to_s.rjust(5, "0"),
          name: resource.name,
          description: resource.description,
          active: resource.active,
          position: resource.position,
          usage_place_id: resource.usage_place_id,
          usage_place: resource.usage_place&.slice(:id, :key, :name, :description),
          input_type: resource.input_type,
          input_group: resource.input_group,
          customer_detail_mode: resource.customer_detail_mode,
          customer_detail_group: resource.customer_detail_group,
          items: resource.standard_list_masters.sort_by { |item| [ item.position, item.id ] }.map do |item|
            Api::V1::StandardListMasterSerializer.new(item).as_json
          end
        }
      end
    end
  end
end
