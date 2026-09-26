module Rf
  class CalculationRestorer
    class CurrentRunNotFoundError < StandardError; end
    class StaleRunError < StandardError; end
    class IncompleteRunError < StandardError; end
    class NotAncestorError < StandardError; end

    def self.call(target_run:, expected_current_run_id:)
      new(
        target_run: target_run,
        expected_current_run_id: expected_current_run_id
      ).call
    end

    def initialize(target_run:, expected_current_run_id:)
      @target_run = target_run
      @expected_current_run_id = expected_current_run_id
    end

    def call
      setting = RfSetting.first

      if setting.nil?
        raise CurrentRunNotFoundError,
              "現在適用中のRFランクがありません"
      end

      setting.with_lock do
        setting.reload

        current_run = setting.current_calculation_run

        if current_run.nil?
          raise CurrentRunNotFoundError,
                "現在適用中のRFランクがありません"
        end

        validate_current_run!(current_run)
        validate_target_run!
        validate_ancestor!(current_run)

        setting.update!(
          current_calculation_run: target_run
        )
      end

      setting
    end

    private

    attr_reader :target_run, :expected_current_run_id

    def validate_current_run!(current_run)
      return if current_run.id == expected_current_run_id

      raise StaleRunError,
            "現在のRFランクが変更されています。再読み込みしてください"
    end

    def validate_target_run!
      return if target_run.status == "completed"

      raise IncompleteRunError,
            "計算完了済みの履歴だけを復元できます"
    end

    def validate_ancestor!(current_run)
      calculation_run = current_run.previous_run

      while calculation_run
        return if calculation_run.id == target_run.id

        calculation_run = calculation_run.previous_run
      end

      raise NotAncestorError,
            "現在のRFランクにつながる過去履歴ではありません"
    end
  end
end
