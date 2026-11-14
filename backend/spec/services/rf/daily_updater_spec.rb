require "rails_helper"
require "fugit"

RSpec.describe Rf::DailyUpdater do
  include ActiveSupport::Testing::TimeHelpers
  let(:master) { create(:standard_master, system_key: "rf_rank") }
  let(:rank) { create(:standard_list_master, standard_master: master) }
  let(:rule) { RfRuleSet.create!(name: "日次", version: 1, status: "published", aggregation_months: 60, frequency_window_months: 12, no_visit_rank: rank) }
  before do
    travel_to Time.zone.local(2026, 11, 14, 3)
    r = rule.recency_rules.create!(code: "R", label: "R", min_days: 0, position: 1)
    f = rule.frequency_rules.create!(code: "F", label: "F", min_visits: 0, position: 1)
    rule.rank_mappings.create!(rf_recency_rule: r, rf_frequency_rule: f, rf_rank: rank)
    create(:customer)
  end
  after { travel_back }

  it "当日基準で計算・適用し、同じ日の再実行でも履歴・設定を増やさない" do
    run = described_class.call(date: "2026-11-14")
    expect(run.status).to eq("completed")
    expect(run.base_date).to eq(Date.new(2026, 11, 14))
    expect(run.monthly_apply_state).to eq("applied")
    expect(RfSetting.first.current_calculation_run_id).to eq(run.id)
    version = RfSetting.first.lock_version
    expect { described_class.call(date: "2026-11-14") }.not_to change(RfCalculationRun, :count)
    expect(RfSetting.first.lock_version).to eq(version)
  end

  it "失敗後は同じ履歴を再計算し、現在適用中の結果を維持する" do
    allow(Rf::CalculationRunner).to receive(:call).and_raise("transient failure")
    expect { described_class.call(date: "2026-11-14") }.to raise_error("transient failure")
    id = RfCalculationRun.first.id
    expect(RfSetting.first.current_calculation_run_id).to be_nil
    allow(Rf::CalculationRunner).to receive(:call).and_call_original
    run = described_class.call(date: "2026-11-14")
    expect(run.id).to eq(id)
    expect(run.monthly_apply_state).to eq("applied")
  end

  it "計算中の手動変更を上書きせず競合として記録する" do
    allow(Rf::CalculationRunner).to receive(:call).and_wrap_original do |original, **args|
      result = original.call(**args)
      RfSetting.first.touch # ポインタが同じでも版が変わったことを検出する。
      result
    end
    run = described_class.call(date: "2026-11-14")
    expect(run.monthly_apply_state).to eq("conflict")
    expect(RfSetting.first.current_calculation_run_id).to be_nil
  end

  it "適用済み自動処理は後日の手動復元を取り消さない" do
    run = described_class.call(date: "2026-11-14")
    RfSetting.first.update!(current_calculation_run: nil)
    described_class.call(date: "2026-11-14")
    expect(run.reload.monthly_apply_state).to eq("applied")
    expect(RfSetting.first.current_calculation_run_id).to be_nil
  end

  it "同じ月でも翌日は新しい履歴を作成し、前日の結果へつなぐ" do
    first = described_class.call(date: "2026-11-13")
    second = described_class.call(date: "2026-11-14")
    expect(second.id).not_to eq(first.id)
    expect(second.previous_run_id).to eq(first.id)
    expect(second.scheduled_on).to eq(Date.new(2026, 11, 14))
    expect(RfSetting.first.current_calculation_run_id).to eq(second.id)
    expect(second.execution_source).to eq("daily")
  end

  it "未来日と不正な日付を拒否する" do
    %w[2026-11-15 2026-02-30 invalid].each do |date|
      expect { described_class.call(date: date) }.to raise_error(ArgumentError)
    end
  end

  it "毎日3時を日本時間で解釈する" do
    schedule = YAML.load_file(Rails.root.join("config/recurring.yml")).dig("production", "daily_rf_update", "schedule")
    next_time = Fugit.parse_cron(schedule).next_time(Time.utc(2026, 11, 14)).to_t
    expect(next_time.utc).to eq(Time.utc(2026, 11, 14, 18))
  end
end
