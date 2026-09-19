class Api::V1::CustomerReservationsController < Api::V1::BaseController
  include ApiPagination

  def index
    customer = Customer.find(params[:customer_id])

    pagination = pagination_params
    return unless pagination

    reservations =
      customer
        .reservations
        .includes(
          :customer,
          :requested_restaurant_master_type,
          :reservation_status,
          :reservation_route,
          :menu_type,
          :occasion,
          :restaurant_masters,
          created_by_staff: :staff_master,
          updated_by_staff: :staff_master
        )
        .order(
          starts_at: :desc,
          id: :desc
        )

    paginated_reservations =
      paginate(
        reservations,
        **pagination
      )

    render_success(
      data: {
        reservations:
          Api::V1::ReservationSerializer.collection(
            paginated_reservations[:records]
          ),
        pagination: paginated_reservations[:metadata]
      }
    )
  end
end
