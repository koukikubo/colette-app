class Api::V1::RestaurantTablesController < Api::V1::BaseController

  before_action :require_staff_login!
  before_action :set_restaurant_table,
                only: %i[show update]

  rescue_from ActiveRecord::StaleObjectError,
              with: :render_stale_object_error
  rescue_from ActiveRecord::RecordNotUnique,
              with: :render_registration_conflict

  def index
    restaurant_tables =
      RestaurantTable
        .includes(
          :restaurant_table_type,
          created_by_staff: :staff_master,
          updated_by_staff: :staff_master
        )
        .ordered

    render_success(
      data: {
        restaurant_tables: restaurant_tables.map do |restaurant_table|
          serialize_restaurant_table(restaurant_table)
        end
      }
    )
  end

  def show
    render_restaurant_table(@restaurant_table)
  end

  def create
      RestaurantTables::CreateService.call(
        attributes: restaurant_table_create_params,
        current_staff: current_staff
      )
      render_restaurant_table(
      restaurant_table,
      status: :created
    )
  end

  def update
    @restaurant_table.assign_attributes(
      restaurant_table_update_params
    )

    @restaurant_table.updated_by_staff = current_staff
    @restaurant_table.save!

    render_restaurant_table(@restaurant_table)
  end

  private

  def set_restaurant_table
    @restaurant_table =
      RestaurantTable
        .includes(
          :restaurant_table_type,
          created_by_staff: :staff_master,
          updated_by_staff: :staff_master
        )
        .find(params[:id])
  end

  

  def restaurant_table_create_params
      params.expect(
        restaurant_table: %i[
          restaurant_table_type_id
          name
          capacity
          active
          position
          memo
        ]
      )
      if permitted_params[
        :restaurant_table_type_id
      ].blank?
        raise ActionController::ParameterMissing.new(
          :restaurant_table_type_id
        )
      end

    permitted_params
  end

  def restaurant_table_update_params
    permitted_params =
      params.expect(
        restaurant_table: %i[
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

  def serialize_restaurant_table(restaurant_table)
    Api::V1::RestaurantTableSerializer
      .new(restaurant_table)
      .as_json
  end

  def render_restaurant_table(
    restaurant_table,
    status: :ok
  )
    render_success(
      data: {
        restaurant_table:
          serialize_restaurant_table(restaurant_table)
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
