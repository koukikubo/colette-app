module Customers
  class VisitFilter
    KEYS = %w[last_visit_from last_visit_to min_visits max_visits].freeze

    def initialize(params, now: Time.current)
      @params = params
      @now = now
    end

    # 不正な条件を黙って解除せず拒否し、他の検索条件とのANDを維持する。
    def apply(customers)
      return customers unless KEYS.any? { |key| @params[key].present? }
      from = date("last_visit_from")
      to = date("last_visit_to")
      min = count("min_visits")
      max = count("max_visits")
      if (from && to && from > to) || (min && max && min > max)
        raise ActionController::BadRequest, "来店条件の最小値は最大値以下にしてください"
      end
      scope = VisitStatistics.new(now: @now).attach(customers)
      scope = scope.where("customer_visits.last_visit_on >= ?", from) if from
      scope = scope.where("customer_visits.last_visit_on <= ?", to) if to
      scope = scope.where("COALESCE(customer_visits.visit_count, 0) >= ?", min) if min
      scope = scope.where("COALESCE(customer_visits.visit_count, 0) <= ?", max) if max
      scope
    end

    private

    def date(key)
      value = @params[key]
      return nil if value.blank?
      raise ArgumentError unless value.is_a?(String) && value.match?(/\A\d{4}-\d{2}-\d{2}\z/)
      parsed = Date.iso8601(value)
      raise ArgumentError unless parsed.year.positive?
      parsed
    rescue ArgumentError
      raise ActionController::BadRequest, "最終来店日は有効なYYYY-MM-DDで指定してください"
    end

    def count(key)
      value = @params[key]
      return nil if value.blank?
      unless value.to_s.match?(/\A\d{1,6}\z/)
        raise ActionController::BadRequest, "来店回数は0以上999999以下の整数で指定してください"
      end
      value.to_i
    end
  end
end
