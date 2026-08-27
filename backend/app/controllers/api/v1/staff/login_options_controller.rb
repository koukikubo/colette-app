class Api::V1::Staff::LoginOptionsController < Api::V1::BaseController
  skip_before_action :require_staff_login!, only: %i[create destroy]
  
  def index
    staffs =
      ::Staff
        .includes(:staff_master)
        .joins(:staff_master)
        .order("staff_masters.code ASC")
        .select(&:login_allowed?)

    render_success(
      data: {
        staff_options:
          staffs.map do |staff|
            {
              id: staff.id,
              code: staff.staff_master.code,
              name: staff.staff_master.name
            }
          end
      }
    )
  end
end
