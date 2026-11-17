require "rails_helper"

RSpec.describe Rf::AppliedRunHistory do
  let(:rule_set) do
    RfRuleSet.create!(
      name: "履歴確認用RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12
    )
  end

  def create_run(base_date:, previous_run: nil)
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      base_date: base_date,
      aggregation_started_on: base_date - 60.months,
      frequency_started_on: base_date - 12.months,
      status: "completed"
    )
  end

  describe ".call" do
    it "現在適用中の計算がなければ空配列を返す" do
      expect(described_class.call(current_run: nil)).to eq([])
    end

    it "現在の計算からつながる履歴だけを返す" do
      previous_run = create_run(
        base_date: Date.new(2025, 10, 1)
      )
      current_run = create_run(
        base_date: Date.new(2026, 10, 1),
        previous_run: previous_run
      )

      # 計算は完了していても、適用されていない結果
      create_run(
        base_date: Date.new(2026, 10, 2),
        previous_run: current_run
      )

      expect(
        described_class.call(current_run: current_run)
      ).to eq([ current_run, previous_run ])
    end

    it "過去の計算へ復元した場合は復元先から履歴を返す" do
      previous_run = create_run(
        base_date: Date.new(2025, 10, 1)
      )
      current_run = create_run(
        base_date: Date.new(2026, 10, 1),
        previous_run: previous_run
      )
      setting = RfSetting.create!(
        current_calculation_run: current_run
      )

      setting.update!(
        current_calculation_run: previous_run
      )

      expect(
        described_class.call(
          current_run: setting.reload.current_calculation_run
        )
      ).to eq([ previous_run ])
    end
  end
end
