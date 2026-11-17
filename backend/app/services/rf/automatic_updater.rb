module Rf
  # 日次と旧月次の計算・適用を共通化し、再試行と手動操作の競合を同じ境界で守る。
  # monthly_apply_*列は既存APIとの互換性のため日次でも使用する。
  class AutomaticUpdater
    class MissingRuleError < StandardError; end

    def self.call(execution_source:, scheduled_date:, base_date:)
      raise ArgumentError, "自動実行種別が不正です" unless %w[monthly daily].include?(execution_source)
      schedule_column = execution_source == "daily" ? :scheduled_on : :scheduled_month
      run = ConfigurationLock.synchronize do
        existing = RfCalculationRun.find_by(schedule_column => scheduled_date)
        next existing if existing
        rule = RfRuleSet.find_by(status: "published")
        raise MissingRuleError, "自動計算用の公開RFルールがありません" unless rule
        validation = RuleSetValidator.call(rule)
        raise MissingRuleError, "公開RFルールの設定を確認してください" unless validation.valid?
        setting = RfSetting.first_or_create!
        # 実行日/月の一意制約と、選択したルール/現在設定の版を永続化して再試行へ引き継ぐ。
        RfCalculationRun.create!(rf_rule_set: rule, base_date: base_date,
          aggregation_started_on: base_date.advance(months: -rule.aggregation_months),
          frequency_started_on: base_date.advance(months: -rule.frequency_window_months),
          previous_run: setting.current_calculation_run, expected_setting_version: setting.lock_version,
          execution_source: execution_source, schedule_column => scheduled_date, monthly_apply_state: "pending")
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
        run.update!(monthly_apply_state: "failed", monthly_apply_error: "RF自動更新に失敗しました。計算履歴とジョブの状態を確認してください")
      end
      raise
    end
  end
end
