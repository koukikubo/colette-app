module Dashboard
  # 完了済みの来店と予約予定を分ける。RFルールには触れず、来店間隔は独立指標として扱う。
  class Analytics
    CUSTOMER_STATS_SQL = <<~SQL.freeze
      WITH visits AS (
        SELECT customer_id, DATE(starts_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo') AS day
        FROM reservations
        WHERE canceled_at IS NULL AND completed_at IS NOT NULL AND starts_at <= $1
          AND customer_id IS NOT NULL
      ), daily AS (
        SELECT DISTINCT customer_id, day FROM visits
      ), gaps AS (
        SELECT customer_id, day - LAG(day) OVER (PARTITION BY customer_id ORDER BY day) AS gap FROM daily
      ), medians AS (
        SELECT customer_id, COUNT(gap) AS gap_count,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY gap) AS median_gap
        FROM gaps GROUP BY customer_id
      )
      SELECT c.id, c.name, c.hidden_at, MIN(v.day) AS first_visit_on, MAX(v.day) AS last_visit_on,
        COUNT(*) FILTER (WHERE v.day >= $2) AS annual_visits,
        COUNT(DISTINCT v.day) FILTER (WHERE v.day >= $3) AS monthly_visit_days,
        m.gap_count, m.median_gap
      FROM visits v JOIN customers c ON c.id = v.customer_id
        JOIN medians m ON m.customer_id = v.customer_id
      GROUP BY c.id, c.name, c.hidden_at, m.gap_count, m.median_gap
      ORDER BY c.id
    SQL

    def self.call(now: Time.current)
      new(now).call
    end

    def initialize(now)
      @now = now
      @today = now.in_time_zone.to_date
      @month = @today.beginning_of_month
      @year = @today.beginning_of_year
      @visits = Reservation.active.where.not(completed_at: nil).where(starts_at: ..now)
    end

    def call
      rows = customer_statistics
      monthly = rows.select { |row| row["last_visit_on"] >= @month }
      returning = monthly.count { |row| row["first_visit_on"] < @month || row["monthly_visit_days"].to_i >= 2 }
      groups = {
        regular: rows.select { |row| row["annual_visits"].to_i >= 4 },
        overdue: rows.select { |row| row["annual_visits"].to_i >= 4 && (@today - row["last_visit_on"]).to_i > 90 },
        new_returning: monthly.select { |row| row["first_visit_on"] >= @month && row["monthly_visit_days"].to_i >= 2 },
        slowing: rows.select { |row| row["gap_count"].to_i >= 3 && (@today - row["last_visit_on"]).to_f > row["median_gap"].to_f * 1.5 }
      }
      { period: { current_month: @month.strftime("%Y-%m"), year: @year.year, through: @today.iso8601 },
        kpis: { monthly_reservations: Reservation.active.where(starts_at: @month.in_time_zone...@month.next_month.in_time_zone).count,
          annual_visits: @visits.where(starts_at: @year.in_time_zone..@now).count,
          new_customers: monthly.count { |row| row["first_visit_on"] >= @month },
          returning_customer_count: returning, monthly_customer_count: monthly.size,
          returning_customer_ratio: monthly.empty? ? nil : (returning.fdiv(monthly.size) * 100).round(1),
          overdue_customers: groups[:overdue].count { |row| row["hidden_at"].nil? } },
        monthly_series: monthly_series,
        rf: rf_distribution,
        insights: groups.transform_values { |members|
          visible = members.select { |row| row["hidden_at"].nil? }
          { count: visible.size, customers: visible.sort_by { |row| [ row["last_visit_on"], row["id"] ] }.first(5).map { |row|
            { id: row["id"], name: row["name"], annual_visits: row["annual_visits"].to_i,
              last_visit_on: row["last_visit_on"].iso8601, days_since_visit: (@today - row["last_visit_on"]).to_i,
              median_interval_days: row["median_gap"]&.to_f }
          } }
        } }
    end

    private

    def customer_statistics
      type = ActiveRecord::Type::DateTime.new
      date_type = ActiveRecord::Type::Date.new
      binds = [ ActiveRecord::Relation::QueryAttribute.new("now", @now, type),
        ActiveRecord::Relation::QueryAttribute.new("annual_start", @today.advance(months: -12), date_type),
        ActiveRecord::Relation::QueryAttribute.new("month_start", @month, date_type) ]
      ActiveRecord::Base.connection.exec_query(CUSTOMER_STATS_SQL, "Dashboard customer statistics", binds).to_a
    end

    def monthly_series
      start = @month.advance(months: -11)
      expression = Arel.sql("TO_CHAR(starts_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM')")
      bookings = Reservation.active.where(starts_at: start.in_time_zone...@month.next_month.in_time_zone).group(expression).count
      actual = @visits.where(starts_at: start.in_time_zone..@now).group(expression).count
      12.times.map { |index|
        month = start.advance(months: index).strftime("%Y-%m")
        { month: month, reservations: bookings.fetch(month, 0), visits: actual.fetch(month, 0) }
      }
    end

    def rf_distribution
      run = RfSetting.first&.current_calculation_run
      return nil unless run&.status == "completed"
      summary = Rf::RunPopulationRowBuilder.call(calculation_run: run)
      { calculation_run_id: run.id, base_date: run.base_date.iso8601,
        excluded_count: summary[:excluded_count], unmatched_count: summary[:unmatched_count],
        ranks: summary.fetch(:ranks).map { |rank| rank.slice(:id, :label, :count) } }
    end
  end
end
