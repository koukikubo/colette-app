module Rf
  class CustomerRankDropPredictor
    Result = Struct.new(
      :base_date,
      :predicted_drop_on,
      :days_until_drop,
      :current_rank,
      :predicted_rank,
      keyword_init: true
    )

    def self.call(customer:, rule_set:, base_date:, until_date:, visit_dates:)
      new(
        customer: customer,
        rule_set: rule_set,
        base_date: base_date,
        until_date: until_date,
        visit_dates: visit_dates
      ).call
    end

    def initialize(customer:, rule_set:, base_date:, until_date:, visit_dates:)
      @customer = customer
      @rule_set = rule_set
      @base_date = base_date.to_date
      @until_date = until_date.to_date

      # 基準日より後の来店は予測に含めない。
      # 同日の複数来店は既存の回数計算に合わせて保持する。
      @visit_dates =
        visit_dates.map(&:to_date).select { |date| date <= @base_date }
    end

    def call
      if until_date <= base_date
        raise ArgumentError, "予測期限は基準日より後を指定してください"
      end

      return nil if customer.excluded_from_rf_calculation?

      current = calculate(base_date)

      # 未訪問状態からの通常ランク低下は予測対象外。
      return nil if no_visit?(current)

      (base_date.next_day..until_date).each do |date|
        predicted = calculate(date)

        # 未訪問への移行は通常ランクの順位低下と分けて扱う。
        next if no_visit?(predicted)
        next unless lower_rank?(current.rf_rank, predicted.rf_rank)

        return Result.new(
          base_date: base_date,
          predicted_drop_on: date,
          days_until_drop: (date - base_date).to_i,
          current_rank: current.rf_rank,
          predicted_rank: predicted.rf_rank
        )
      end

      nil
    end

    private

    attr_reader :customer, :rule_set, :base_date, :until_date, :visit_dates

    def calculate(date)
      CustomerRankCalculator.call_with_visit_dates(
        customer: customer,
        rule_set: rule_set,
        base_date: date,
        visit_dates: visit_dates
      )
    end

    def no_visit?(result)
      result.last_visit_on.nil?
    end

    def lower_rank?(current_rank, predicted_rank)
      RankMovementClassifier.call(
        previous_rank: {
          id: current_rank.id,
          position: current_rank.position
        },
        current_rank: {
          id: predicted_rank.id,
          position: predicted_rank.position
        }
      ) == :down
    end
  end
end
