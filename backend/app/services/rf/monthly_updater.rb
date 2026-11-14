module Rf
  # 旧月次履歴の再配信との互換入口。新しい定期実行はDailyUpdaterを使用する。
  class MonthlyUpdater
    MissingRuleError = AutomaticUpdater::MissingRuleError

    def self.call(month:)
      period = Date.iso8601(month.to_s)
      unless period.day == 1 && period < Date.current.beginning_of_month
        raise ArgumentError, "前月以前の月初日をYYYY-MM-DD形式で指定してください"
      end
      AutomaticUpdater.call(execution_source: "monthly", scheduled_date: period, base_date: period.end_of_month)
    end
  end
end
