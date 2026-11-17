module Rf
  class MonthComparisonPeriod
    class InvalidPeriodError < StandardError; end

    def self.call(start_month:, end_month:, today: Date.current)
      start_date = parse_month(start_month)
      end_date = parse_month(end_month)

      if start_date > end_date
        raise InvalidPeriodError,
              "開始月は終了月以前を指定してください"
      end

      if end_date > today.beginning_of_month
        raise InvalidPeriodError,
              "未来の月は指定できません"
      end

      {
        start_month: start_month,
        end_month: end_month,
        start_base_date: [ start_date.end_of_month, today ].min,
        end_base_date: [ end_date.end_of_month, today ].min,
        provisional: end_date == today.beginning_of_month
      }
    end

    def self.parse_month(value)
      unless value.is_a?(String) &&
          value.match?(/\A[0-9]{4}-(0[1-9]|1[0-2])\z/)
        raise InvalidPeriodError,
              "比較月はYYYY-MM形式で指定してください"
      end

      date = Date.iso8601("#{value}-01")

      unless date.year.positive?
        raise InvalidPeriodError,
              "有効な年月を指定してください"
      end

      date
    end

    private_class_method :parse_month
  end
end
