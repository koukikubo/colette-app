module Customers
  class Analytics
    def self.call(now: Time.current)
      new(now).call
    end

    def initialize(now)
      @statistics = VisitStatistics.new(now: now)
    end

    # 一つのSQLスナップショットでサマリーと上位10件を読む。全顧客をRubyへ実体化しない。
    def call
      scope = @statistics.attach(Customer.where(hidden_at: nil)).select(
        "customers.id, customers.name, customer_visits.first_visit_on, customer_visits.last_visit_on, " \
        "COALESCE(customer_visits.visit_count, 0) AS visit_count, " \
        "COALESCE(customer_visits.monthly_visits, 0) AS monthly_visits, " \
        "COALESCE(customer_visits.monthly_visit_days, 0) AS monthly_visit_days"
      )
      month = ActiveRecord::Base.connection.quote(@statistics.month_from)
      row = ActiveRecord::Base.connection.select_one(<<~SQL)
        WITH customer_scope AS (#{scope.to_sql})
        SELECT COUNT(*) AS customer_count, COALESCE(SUM(monthly_visits), 0) AS monthly_visits,
          COUNT(*) FILTER (WHERE monthly_visits > 0) AS monthly_customers,
          COUNT(*) FILTER (WHERE monthly_visits > 0 AND (first_visit_on < #{month} OR monthly_visit_days >= 2)) AS returning_customers,
          (SELECT COALESCE(json_agg(ranked), '[]'::json) FROM (
            SELECT id, name, visit_count, last_visit_on FROM customer_scope WHERE visit_count > 0
            ORDER BY visit_count DESC, last_visit_on DESC, id ASC LIMIT 10
          ) ranked) AS ranking
        FROM customer_scope
      SQL
      count = row.fetch("monthly_customers").to_i
      returning = row.fetch("returning_customers").to_i
      ranking = row.fetch("ranking")
      { period: { month_from: @statistics.month_from.iso8601, through: @statistics.today.iso8601, ranking_from: @statistics.ranking_from.iso8601 },
        summary: { customer_count: row.fetch("customer_count").to_i, monthly_visits: row.fetch("monthly_visits").to_i,
          monthly_customers: count, returning_customers: returning,
          returning_ratio: count.zero? ? nil : (returning.fdiv(count) * 100).round(1) },
        ranking: ranking.is_a?(String) ? JSON.parse(ranking) : ranking }
    end
  end
end
