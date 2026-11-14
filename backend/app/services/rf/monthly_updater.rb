module Rf
  class MonthlyUpdater
    class MissingRuleError < StandardError; end

    def self.call(month:)
      period = Date.iso8601(month.to_s)
      unless period.day == 1 && period < Date.current.beginning_of_month
        raise ArgumentError, "前月以前の月初日をYYYY-MM-DD形式で指定してください"
      end
      run = ConfigurationLock.synchronize do
        existing = RfCalculationRun.find_by(scheduled_month: period)
        next existing if existing
        rule = RfRuleSet.find_by(status: "published")
        raise MissingRuleError, "月次計算用の公開RFルールがありません" unless rule
        validation = RuleSetValidator.call(rule)
        raise MissingRuleError, "公開RFルールの設定を確認してください" unless validation.valid?
        setting = RfSetting.first_or_create!
        base = period.end_of_month
        # 月単位の一意制約と、選択したルール/現在設定の版を永続化して再試行へ引き継ぐ。
        RfCalculationRun.create!(rf_rule_set: rule, base_date: base,
          aggregation_started_on: base.advance(months: -rule.aggregation_months),
          frequency_started_on: base.advance(months: -rule.frequency_window_months),
          previous_run: setting.current_calculation_run, expected_setting_version: setting.lock_version,
          execution_source: "monthly", scheduled_month: period, monthly_apply_state: "pending")
      end
      return run if %w[applied conflict].include?(run.monthly_apply_state)

      CalculationRunner.call(calculation_run: run, recover: true, retry_failed: true)
      return run unless run.reload.status == "completed"

      ConfigurationLock.synchronize do
        run.lock!
        next if %w[applied conflict].include?(run.monthly_apply_state)
        setting = RfSetting.first!
        setting.lock!
        # 手動復元で同じ履歴へ戻った場合も、版の違いで検出して上書きしない。
        if setting.current_calculation_run_id != run.previous_run_id || setting.lock_version != run.expected_setting_version || (setting.current_calculation_run && setting.current_calculation_run.base_date > run.base_date)
          run.update!(monthly_apply_state: "conflict", monthly_apply_error: "計算開始後に手動操作が行われたか、より新しい結果が適用されています。内容を確認して手動で適用してください")
        else
          RankAvailability.ensure_available!(run.rf_rule_set)
          setting.update!(current_calculation_run: run)
          run.update!(monthly_apply_state: "applied", monthly_apply_error: nil)
        end
      end
      run.reload
    rescue StandardError
      if defined?(run) && run&.persisted? && !%w[applied conflict].include?(run.reload.monthly_apply_state)
        run.update!(monthly_apply_state: "failed", monthly_apply_error: "月次自動更新に失敗しました。計算履歴とジョブの状態を確認してください")
      end
      raise
    end
  end
end
