module Rf
  class CalculationRollback
    class CurrentRunNotFoundError < StandardError; end
    class PreviousRunNotFoundError < StandardError; end

    def self.call
      new.call
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
  end
end
