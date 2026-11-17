# frozen_string_literal: true

puts "RF計算確認用の来店履歴を作成します"

base_date = Date.new(2026, 10, 6)

staff = Staff.first!

seat_type =
  StandardListMaster
    .joins(:standard_master)
    .find_by!(
      code: "T",
      standard_masters: {
        system_key: "restaurant_master_type"
      }
    )

reservation_status =
  StandardListMaster
    .joins(:standard_master)
    .find_by!(
      code: "confirmed",
      standard_masters: {
        system_key: "reservation_status"
      }
    )

customers =
  Customer
    .where("email LIKE ?", "%@seed.colette.test")
    .where(hidden_at: nil)
    .order(:id)

visit_patterns = [
  [ 10, 25, 40, 55, 70, 85 ], # A想定
  [ 20, 45, 75, 100 ],        # B想定
  [ 30, 120 ],                # C想定
  [ 120 ],                    # C想定
  [ 400 ],                    # D想定
  [ 800 ],                    # Z想定
  []                        # N想定
].freeze

previous_visit_patterns = [
  [ 10, 25, 40, 55, 70, 85 ],
  [ 20, 45, 75, 100 ],
  [ 30, 120 ],
  [ 120 ],
  [ 400 ],
  [ 800 ],
  []
].freeze

datasets = [
  {
    base_date: base_date.prev_year,
    patterns: previous_visit_patterns,
    index_shift: 2
  },
  {
    base_date: base_date,
    patterns: visit_patterns,
    index_shift: 0
  }
].freeze

Reservation.transaction do
  customers.find_each.with_index do |customer, index|
    datasets.each do |dataset|
      patterns = dataset.fetch(:patterns)
      pattern_index =
        (index + dataset.fetch(:index_shift)) % patterns.length

      offsets = patterns.fetch(pattern_index)

      offsets.each do |days_ago|
        visit_date = dataset.fetch(:base_date) - days_ago.days

        starts_at =
          Time.zone.local(
            visit_date.year,
            visit_date.month,
            visit_date.day,
            18,
            0
          )

        ends_at = starts_at + 2.hours

        reservation =
          Reservation.find_or_initialize_by(
            customer: customer,
            starts_at: starts_at
          )

        reservation.assign_attributes(
          reservation_name: customer.name,
          reservation_phone_number:
            customer.phone_number || "09000000000",
          ends_at: ends_at,
          guest_count: 2,
          requested_restaurant_master_type: seat_type,
          reservation_status: reservation_status,
          completed_at: ends_at,
          canceled_at: nil,
          created_by_staff: staff,
          updated_by_staff: staff
        )

        reservation.save!
      end
    end
  end
end

puts "RF計算確認用の来店履歴を登録しました"
