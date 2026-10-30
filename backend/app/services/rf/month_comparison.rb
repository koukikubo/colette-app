module Rf
  class MonthComparison
    class UnavailableError < StandardError; end

    def self.call(current_run:, start_month:, end_month:)
      period = MonthComparisonPeriod.call(start_month: start_month, end_month: end_month)
      runs = AppliedRunHistory.call(current_run: current_run)
      start_run = select_run(runs, period.fetch(:start_base_date))
      end_run = select_run(runs, period.fetch(:end_base_date))

      if start_run.rf_rule_set_id != end_run.rf_rule_set_id
        raise UnavailableError, "開始月と終了月のRFルールが異なるため比較できません"
      end

      {
        start_month: start_month,
        end_month: end_month,
        provisional: period.fetch(:provisional),
        start_run: describe_run(start_run),
        end_run: describe_run(end_run),
        movement: CustomerMovementSummary.call(
          calculation_run: end_run, comparison_run: start_run
        )
      }
    end

    def self.select_run(runs, cutoff)
      run = runs.select do |candidate|
        candidate.status == "completed" &&
          candidate.base_date.between?(cutoff.beginning_of_month, cutoff)
      end.max_by { |candidate| [ candidate.base_date, candidate.id ] }
      return run if run

      raise UnavailableError, "#{cutoff.strftime('%Y-%m')}に適用済みの完了したRF計算履歴がありません"
    end

    def self.describe_run(run)
      { id: run.id, base_date: run.base_date, rule_set_id: run.rf_rule_set_id }
    end

    private_class_method :select_run, :describe_run
  end
end
