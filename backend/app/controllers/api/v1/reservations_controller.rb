class Api::V1::ReservationsController < ApplicationController
  before_action :set_reservation, only: %i[show update]

  def reservation_create_params
    permitted_params =
      params.expect(
        reservation: %i[
          reservation_route_id
          menu_type_id
          occasion_id
          guest_count
          allergy_note
          disliked_food_note
          preferred_food_note
        ]
      )

    if permitted_params[:reservation_route_id].blank?
      raise ActionController::ParameterMissing.new(
        :reservation_route_id
      )
    end

    if permitted_params[:menu_type_id].blank?
      raise ActionController::ParameterMissing.new(
        :menu_type_id
      )
    end

    if permitted_params[:occasion_id].blank?
      raise ActionController::ParameterMissing.new(
        :occasion_id
      )
    end

    if permitted_params[:guest_count].blank?
      raise ActionController::ParameterMissing.new(
        :guest_count
      )
    end

    permitted_params
  end

  def reservation_update_params
    permitted_params =
      params.expect(
        reservation: %i[
          reservation_route_id
          menu_type_id
          occasion_id
          guest_count
          allergy_note
          disliked_food_note
          preferred_food_note
          details_confirmed_at
          canceled_at
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
  def index
    reservations = Reservation.all
    render_success(
      data: {
        reservations:
          reservations.map do |reservation|
            serialize_reservation(reservation)
          end
      }
    )
  end

  def show
    render_reservation(@reservation)
  end 

  def create
    reservation =
      Reservations::CreateService.call(
        attributes: reservation_create_params,
        current_staff: current_staff
      )

    render_reservation(
      reservation,
      status: :created
    )
  end 

  def update
    @reservation.assign_attributes(
      reservation_update_params
    )

    @reservation.updated_by_staff = current_staff
    @reservation.save!

    render_reservation(@reservation)
  end

  private

  def set_reservation
    @reservation =
      Reservation
        .includes(
          :reservation_route,
          :menu_type,
          :occasion,
          created_by_staff: :staff_master,
          updated_by_staff: :staff_master
        )
        .find(params[:id])
  end
end
