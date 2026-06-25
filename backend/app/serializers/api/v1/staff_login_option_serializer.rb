module Api
  module V1
    class StaffLoginOptionSerializer < ApplicationSerializer
      def as_json(*)
        {
          id: resource.id,
          name: resource.staff_master.name
        }
      end
    end
  end
end