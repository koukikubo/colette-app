module Rf
  class CalculationRollback
    class CurrentRunNotFoundError < StandardError; end
    class PreviousRunNotFoundError < StandardError; end
    class StaleRunError < StandardError; end

    def self.call(expected_current_run_id:)
      new(
        expected_current_run_id: expected_current_run_id
      ).call
    end

    def initialize(expected_current_run_id:)
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
        previous_run = current_run.previous_run

        if previous_run.nil?
          raise PreviousRunNotFoundError,
                "復元できる以前の計算結果がありません"
        end

        setting.update!(
          current_calculation_run: previous_run
        )
      end

      setting
    end

    private

    attr_reader :expected_current_run_id

    def validate_current_run!(current_run)
      return if current_run.id == expected_current_run_id

      raise StaleRunError,
            "現在のRFランクが変更されています。再読み込みしてください"
    end
  end
end
