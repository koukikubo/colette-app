class Api::V1::StaffMastersController < Api::V1::BaseController
  before_action :require_staff_login!
  before_action :set_staff_master,
                only: %i[
                  show
                  update
                  retire
                  restore
                  update_login_enabled
                  reset_failed_attempts
                ]

  def index
    staff_masters = StaffMaster.include(:staff).ordered

    render_success(
      data: {
        staff_masters: staff_masters.map do |staff_master|
          Api::V1::StaffMasterSerializer.new(staff_master).as_json
        end
      }
    )
  end 

  def show
    render_success(
      data: {
        staff_master:
          Api::V1::StaffMasterSerializer.new(@staff_master).as_json
      }
    )
  end

  def create
  end

  def update
  end

  def retire
  end

  def restore
  end

  def update_login_enabled
  end

  def reset_failed_attempts
  end

  private

  def set_staff_master
    @staff_master = StaffMaster.find(params[:id])
  end


end
