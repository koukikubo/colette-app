module Rf
  class CalculationRunStarter
    class InvalidRuleSetError < StandardError; end

    def self.call(rule_set:, base_date:, started_by_staff: nil)
      new(
        rule_set: rule_set,
        base_date: base_date,
        started_by_staff: started_by_staff
      ).call
    end

    def initialize(rule_set:, base_date:, started_by_staff:)
      @rule_set = rule_set
      @base_date = base_date.to_date
      @started_by_staff = started_by_staff
    end

    def call
      validate_rule_set!

      calculation_run = create_calculation_run!

      RfCalculationRunJob.perform_later(calculation_run.id)

      calculation_run
    end

    private

    attr_reader :rule_set, :base_date, :started_by_staff

    def validate_rule_set!
      unless rule_set.status == "published"
        raise InvalidRuleSetError,
              "公開済みのRFルールを指定してください"
      end

      validation_result = Rf::RuleSetValidator.call(rule_set)

      return if validation_result.valid?

      messages =
        validation_result
          .errors
          .map { |error| error[:message] }

      raise InvalidRuleSetError, messages.join(" / ")
    end

    def create_calculation_run!
      RfCalculationRun.create!(
        rf_rule_set: rule_set,
        previous_run: current_calculation_run,
        started_by_staff: started_by_staff,
        base_date: base_date,
        aggregation_started_on: base_date.advance(
          months: -rule_set.aggregation_months
        ),
        frequency_started_on: base_date.advance(
          months: -rule_set.frequency_window_months
        )
      )
    end

    def current_calculation_run
      RfSetting.first&.current_calculation_run
    end
  end
end
