class Api::V1::RestaurantMastersController < Api::V1::BaseController

  before_action :require_staff_login!
  before_action :set_restaurant_master,
                only: %i[show update]

  rescue_from ActiveRecord::StaleObjectError,
              with: :render_stale_object_error
  rescue_from ActiveRecord::RecordNotUnique,
              with: :render_registration_conflict

  def index
    restaurant_masters =
      RestaurantMaster
        .includes(
          :restaurant_master_type,
          created_by_staff: :staff_master,
          updated_by_staff: :staff_master
        )
        .ordered

    render_success(
      data: {
        restaurant_masters: restaurant_masters.map do |restaurant_master|
          serialize_restaurant_master(restaurant_master)
        end
      }
    )
  end

  def show
    render_restaurant_master(@restaurant_master)
  end

  def create
    restaurant_master =
      RestaurantMasters::CreateService.call(
        attributes: restaurant_master_create_params,
        current_staff: current_staff
      )
      render_restaurant_master(
      restaurant_master,
      status: :created
    )
  end

  def update
    @restaurant_master.assign_attributes(
      restaurant_master_update_params
    )

    @restaurant_master.updated_by_staff = current_staff
    @restaurant_master.save!

    render_restaurant_master(@restaurant_master)
  end

  private

  def set_restaurant_master
    @restaurant_master =
      RestaurantMaster
        .includes(
          :restaurant_master_type,
          created_by_staff: :staff_master,
          updated_by_staff: :staff_master
        )
        .find(params[:id])
  end

  

  def restaurant_master_create_params
    permitted_params =
      params.expect(
        restaurant_master: %i[
          restaurant_master_type_id
          name
          capacity
          active
          position
          memo
        ]
      )

    if permitted_params[
      :restaurant_master_type_id
    ].blank?
      raise ActionController::ParameterMissing.new(
        :restaurant_master_type_id
      )
    end

    permitted_params
  end

  def restaurant_master_update_params
    permitted_params =
      params.expect(
        restaurant_master: %i[
          name
          capacity
          active
          position
          memo
          lock_version
        ]
      )

    if permitted_params[:lock_version].nil?
      raise ActionController::ParameterMissing.new(
      :lock_version
      )
    end
    permitted_params
  end

  def serialize_restaurant_master(restaurant_master)
    Api::V1::RestaurantMasterSerializer
      .new(restaurant_master)
      .as_json
  end

  def render_restaurant_master(
    restaurant_master,
    status: :ok
  )
    render_success(
      data: {
        restaurant_master:
          serialize_restaurant_master(restaurant_master)
      },
      status: status
    )
  end


  # エラー系

  def render_stale_object_error(_error)
    render_error(
      message:
        "席情報は別の担当者によって更新されています",
      errors: [
        "最新の席情報を再取得してから、もう一度操作してください"
      ],
      status: :conflict
    )
  end

  def render_registration_conflict(_error)
    render_error(
      message: "席コードの登録が競合しました",
      errors: [
        "最新情報を再取得してから、もう一度登録してください"
      ],
      status: :conflict
    )
  end
end
