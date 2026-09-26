module Rf
  class CalculationActivator
    class IncompleteRunError < StandardError; end
    class StaleRunError < StandardError; end

    def self.call(calculation_run:)
      new(calculation_run: calculation_run).call
    end

    def initialize(calculation_run:)
      @calculation_run = calculation_run
    end

    def call
      validate_completed!

      setting = RfSetting.first_or_create!

      setting.with_lock do
        setting.reload

        return setting if already_active?(setting)

        validate_previous_run!(setting)

        setting.update!(
          current_calculation_run: calculation_run
        )
      end

      setting
    end

    private

    attr_reader :calculation_run

    def validate_completed!
      return if calculation_run.status == "completed"

      raise IncompleteRunError,
            "計算完了済みの履歴だけを適用できます"
    end

    def already_active?(setting)
      setting.current_calculation_run_id ==
        calculation_run.id
    end

    def validate_previous_run!(setting)
      return if setting.current_calculation_run_id ==
        calculation_run.previous_run_id

      raise StaleRunError,
            "現在のRFランクが変更されています。再計算してください"
    end
  end
end
