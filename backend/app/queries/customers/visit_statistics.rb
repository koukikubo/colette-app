module Customers
  # 検索とランキングが同じ退店実績を参照する。予定・取消・未来の記録は集計しない。
  class VisitStatistics
    attr_reader :today, :month_from, :ranking_from

    def initialize(now: Time.current)
      @now = now
      @today = now.in_time_zone("Asia/Tokyo").to_date
      @month_from = today.beginning_of_month
      @ranking_from = today.advance(months: -12)
    end

    # 顧客ごとに集約してから結合するため、予約件数で一覧やページ件数が増えない。
    def attach(customers)
      customers.joins("LEFT JOIN (#{statistics.to_sql}) customer_visits ON customer_visits.customer_id = customers.id")
    end

    private

    def statistics
      connection = ActiveRecord::Base.connection
      day = "DATE(starts_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')"
      annual = connection.quote(ranking_from)
      monthly = connection.quote(month_from)
      Reservation.recorded_visits(as_of: @now).where.not(customer_id: nil).group(:customer_id).select(
        "customer_id, MIN(#{day}) AS first_visit_on, MAX(#{day}) AS last_visit_on, " \
        "COUNT(*) FILTER (WHERE #{day} >= #{annual}) AS visit_count, " \
        "COUNT(*) FILTER (WHERE #{day} >= #{monthly}) AS monthly_visits, " \
        "COUNT(DISTINCT #{day}) FILTER (WHERE #{day} >= #{monthly}) AS monthly_visit_days"
      )
    end
  end
end
