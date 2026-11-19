module Rf
  # 一度のSELECTで全顧客の実績・対象外判定を固定する。
  # PostgreSQLの文単位スナップショットを使い、計算中の予約訂正を途中の顧客だけへ反映しない。
  class CalculationInputs
    def self.call(rule_set:, base_date:, as_of: Time.current)
      connection = ActiveRecord::Base.connection
      period = base_date.advance(months: -rule_set.aggregation_months).beginning_of_day...base_date.next_day.beginning_of_day
      visits = Reservation.recorded_visits(as_of: as_of).where(starts_at: period).select(:customer_id, :starts_at)
      frequency_start = connection.quote(base_date.advance(months: -rule_set.frequency_window_months).beginning_of_day)
      excluded_code = connection.quote(Customer::RF_EXCLUDED_RANK_CODE)
      sql = <<~SQL
        SELECT customers.id AS customer_id,
          COALESCE(ranks.code = #{excluded_code}, FALSE) AS excluded,
          DATE(MAX(visits.starts_at) AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') AS last_visit_on,
          COUNT(visits.starts_at) FILTER (WHERE visits.starts_at >= #{frequency_start}) AS frequency_count
        FROM customers
        LEFT JOIN standard_list_masters ranks ON ranks.id = customers.customer_rank_id
        LEFT JOIN (#{visits.to_sql}) visits ON visits.customer_id = customers.id
        WHERE customers.hidden_at IS NULL
        GROUP BY customers.id, ranks.code
      SQL
      connection.select_all(sql).to_h do |row|
        [ row.fetch("customer_id"), { excluded: row.fetch("excluded"),
          last_visit_on: row["last_visit_on"]&.to_date, frequency_count: row.fetch("frequency_count").to_i }.freeze ]
      end.freeze
    end
  end
end
