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
    staff_masters = StaffMaster.includes(:staff).ordered

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
    staff_master = StaffMaster.new(staff_master_params)

    ActiveRecord::Base.transaction do
      staff_master.save!
      staff_master.create_staff!(staff_create_params)
    end

    render_staff_master(
      staff_master.reload,
      status: :created
    )
  rescue ActiveRecord::RecordInvalid => error
    render_validation_error(error.record)
  end

  def update
    if @staff_master.update(staff_master_params)
      render_staff_master(@staff_master.reload)
    else
      render_validation_error(@staff_master)
    end
  end

  def retire
    if @staff_master.retired?
      return render_error(
        message: "すでに退職済みの担当者です",
        status: :unprocessable_entity
      )
    end

    if @staff_master.update(retire_params)
      render_staff_master(@staff_master.reload)
    else
      render_validation_error(@staff_master)
    end
  end

  def restore
    if @staff_master.active?
      return render_error(
        message: "担当者はすでに在籍中です",
        status: :unprocessable_entity
      )
    end

    if @staff_master.update(retired_on: nil)
      render_staff_master(@staff_master.reload)
    else
      render_validation_error(@staff_master)
    end
  end

  def update_login_enabled
    staff = associated_staff

    return if performed?

    if staff.update(login_enabled_params)
      render_staff_master(@staff_master.reload)
    else
      render_validation_error(staff)
    end
  end

  def reset_failed_attempts
    staff = associated_staff

    return if performed?

    # failed_attemptsとlocked_atをまとめてリセットする
    staff.unlock!

    render_staff_master(@staff_master.reload)
  end

  private

  def set_staff_master
    @staff_master = StaffMaster
                      .includes(:staff)
                      .find(params[:id])
  end

  def staff_master_params
    params.expect(
      staff_master: %i[
        code
        name
        role_code
        employment_started_on
        memo
      ]
    )
  end

  def staff_create_params
    params.expect(
      staff: %i[
        password
        password_confirmation
        login_enabled
      ]
    )
  end

  def login_enabled_params
    params.expect(
      staff: [:login_enabled]
    )
  end

  def associated_staff
    staff = @staff_master.staff

    return staff if staff.present?

    render_error(
      message: "担当者のログイン情報が登録されていません",
      status: :unprocessable_entity
    )

    nil
  end

  def serialize_staff_master(staff_master)
    Api::V1::StaffMasterSerializer
      .new(staff_master)
      .as_json
  end

  def render_staff_master(staff_master, status: :ok)
    render_success(
      data: {
        staff_master: serialize_staff_master(staff_master)
      },
      status: status
    )
  end

  def render_validation_error(record)
    render_error(
      message: "入力内容に誤りがあります",
      errors: record.errors.full_messages,
      status: :unprocessable_entity
    )
  end

  def retire_params
    params.expect(
      staff_master: [:retired_on]
    )
  end
end
