module Api
  module V1
    class StandardListMasterSerializer < ApplicationSerializer
      def as_json
        data = {
          id: resource.id,
          display_code: resource.display_code,
          # T/Cなどの業務コードは読み取り専用。項目のDB idとは別に返す。
          code: resource.code,
          label: resource.label,
          description: resource.description,
          position: resource.position,
          active: resource.active,
          display_color: resource.display_color
        }

        default_color = resource.default_display_color

        return data if default_color.nil?

        data.merge(
          default_display_color: default_color
        )
      end
    end
  end
end
