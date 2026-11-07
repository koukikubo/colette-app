require "rails_helper"

RSpec.describe Rf::MonthComparisonPeriod do
  let(:today) { Date.new(2026, 10, 28) }

  it "過去の月はそれぞれ月末を基準日にする" do
    result = described_class.call(
      start_month: "2025-10",
      end_month: "2026-09",
      today: today
    )

    expect(result).to eq(
      {
        start_month: "2025-10",
        end_month: "2026-09",
        start_base_date: Date.new(2025, 10, 31),
        end_base_date: Date.new(2026, 9, 30),
        provisional: false
      }
    )
  end

  it "終了月が当月なら当日を基準日にする" do
    result = described_class.call(
      start_month: "2025-10",
      end_month: "2026-10",
      today: today
    )

    expect(result.fetch(:start_base_date)).to eq(
      Date.new(2025, 10, 31)
    )
    expect(result.fetch(:end_base_date)).to eq(today)
    expect(result.fetch(:provisional)).to be(true)
  end

  it "うるう年の2月末を扱える" do
    result = described_class.call(
      start_month: "2024-02",
      end_month: "2025-02",
      today: today
    )

    expect(result.fetch(:start_base_date)).to eq(
      Date.new(2024, 2, 29)
    )
    expect(result.fetch(:end_base_date)).to eq(
      Date.new(2025, 2, 28)
    )
  end

  it "開始月が終了月より後ならエラーにする" do
    expect do
      described_class.call(
        start_month: "2026-09",
        end_month: "2026-08",
        today: today
      )
    end.to raise_error(
      described_class::InvalidPeriodError,
      "開始月は終了月以前を指定してください"
    )
  end

  it "未来の月は指定できない" do
    expect do
      described_class.call(
        start_month: "2026-09",
        end_month: "2026-11",
        today: today
      )
    end.to raise_error(
      described_class::InvalidPeriodError,
      "未来の月は指定できません"
    )
  end

  it "不正な年月の指定を拒否する" do
    [ nil, "", "2026-1", "2026-13", "2026-10-01", "0000-01" ].each do |value|
      expect do
        described_class.call(
          start_month: value,
          end_month: "2026-10",
          today: today
        )
      end.to raise_error(
        described_class::InvalidPeriodError
      )
    end
  end
end
