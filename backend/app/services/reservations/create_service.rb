module Reservations
  class CreateService
    def self.call(attributes:, current_staff:)
      new(
        attributes: attributes,
        current_staff: current_staff
      ).call
    end

    def initialize(attributes:, current_staff:)
      @attributes = attributes.to_h.deep_symbolize_keys
      @current_staff = current_staff
    end

    def call
      ActiveRecord::Base.transaction do
        restaurant_master_ids = extract_restaurant_master_ids

        reservation = Reservation.new(reservation_attributes)

        apply_customer_to_reservation(reservation)
        apply_default_status(reservation)
        apply_staff(reservation)

        Reservations::DoubleBookingValidator.call(
          reservation: reservation,
          restaurant_master_ids: restaurant_master_ids
        )

        reservation.save!

        assign_restaurant_masters!(
          reservation: reservation,
          restaurant_master_ids: restaurant_master_ids
        )

        reservation
      end
    end

    private

    attr_reader :attributes, :current_staff

    def reservation_attributes
      attributes.except(:restaurant_master_ids)
    end

    def extract_restaurant_master_ids
      return nil unless attributes.key?(:restaurant_master_ids)

      Array(attributes[:restaurant_master_ids])
        .reject(&:blank?)
        .map(&:to_i)
        .uniq
    end

    def apply_customer_to_reservation(reservation)
      return if reservation.customer_id.blank?

      customer = Customer.find(reservation.customer_id)

      reservation.customer = customer
      reservation.reservation_name = customer.name

      if reservation.reservation_phone_number.blank?
        reservation.reservation_phone_number = customer.phone_number
      end
    end

    def apply_default_status(reservation)
      reservation.reservation_status =
        StandardListMaster
          .joins(:standard_master)
          .find_by!(
            code: "confirmed",
            standard_master: {
              system_key: "reservation_status"
            }
          )
    end

    def apply_staff(reservation)
      reservation.created_by_staff = current_staff
      reservation.updated_by_staff = current_staff
    end
  end
end