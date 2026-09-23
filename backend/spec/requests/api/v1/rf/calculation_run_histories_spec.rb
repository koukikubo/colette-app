require "rails_helper"

RSpec.describe "Api::V1::RfCalculationRunHistories",
               type: :request do
  include_context "authenticated request"

  def response_body
    JSON.parse(response.body)
  end

  let(:rule_set) do
    RfRuleSet.create!(
      name: "公開RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: "published",
      published_at: Time.current
    )
  end

  describe "GET /api/v1/rf_calculation_runs" do
    it "計算履歴を新しい順に返す" do
      login!

      previous_run =
        create_completed_run(
          base_date: Date.new(2026, 8, 31)
        )

      current_run =
        create_completed_run(
          base_date: Date.new(2026, 9, 23),
          previous_run: previous_run
        )

      RfSetting.create!(
        current_calculation_run: current_run
      )

      get(
        "/api/v1/rf_calculation_runs",
        params: {
          page: 1,
          per_page: 20
        },
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:ok)

      calculation_runs =
        response_body.dig(
          "data",
          "calculation_runs"
        )

      expect(
        calculation_runs.pluck("id")
      ).to eq(
        [
          current_run.id,
          previous_run.id
        ]
      )

      expect(calculation_runs.first).to include(
        "id" => current_run.id,
        "base_date" => "2026-09-23",
        "status" => "completed",
        "current" => true,
        "restorable" => false
      )

      expect(calculation_runs.second).to include(
        "id" => previous_run.id,
        "base_date" => "2026-08-31",
        "status" => "completed",
        "current" => false,
        "restorable" => true
      )

      expect(
        response_body.dig(
          "data",
          "pagination",
          "total_count"
        )
      ).to eq(2)
    end
  end

  describe "GET /api/v1/rf_calculation_runs/:id" do
    it "指定した計算履歴の詳細を返す" do
      login!

      previous_run =
        create_completed_run(
          base_date: Date.new(2026, 8, 31)
        )

      current_run =
        create_completed_run(
          base_date: Date.new(2026, 9, 23),
          previous_run: previous_run
        )

      RfSetting.create!(
        current_calculation_run: current_run
      )

      get(
        "/api/v1/rf_calculation_runs/#{previous_run.id}",
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:ok)

      calculation_run =
        response_body.dig(
          "data",
          "calculation_run"
        )

      expect(calculation_run).to include(
        "id" => previous_run.id,
        "rf_rule_set_id" => rule_set.id,
        "base_date" => "2026-08-31",
        "status" => "completed",
        "customer_count" => 10,
        "excluded_count" => 1,
        "current" => false,
        "restorable" => true
      )

      expect(calculation_run["preview"]).to include(
        "changed_count" => 0,
        "unchanged_count" => 0,
        "excluded_count" => 0
      )
    end

    it "存在しない計算履歴の場合は404を返す" do
      login!

      get(
        "/api/v1/rf_calculation_runs/999999",
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:not_found)
      expect(response_body["message"])
        .to eq("データが見つかりませんでした")
    end
  end

  private

  def create_completed_run(base_date:, previous_run: nil)
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      started_by_staff: login_staff,
      base_date: base_date,
      aggregation_started_on:
        base_date.advance(months: -60),
      frequency_started_on:
        base_date.advance(months: -12),
      status: "completed",
      customer_count: 10,
      excluded_count: 1,
      completed_at: Time.current
    )
  end
end
