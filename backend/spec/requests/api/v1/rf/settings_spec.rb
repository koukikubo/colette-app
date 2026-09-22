require "rails_helper"

RSpec.describe "Api::V1::RfSettings", type: :request do
  include_context "authenticated request"

  def response_body
    JSON.parse(response.body)
  end

  describe "GET /api/v1/rf_settings" do
    it "未ログインの場合は401を返す" do
      get "/api/v1/rf_settings"

      expect(response).to have_http_status(:unauthorized)
    end

    it "公開中のRFルールと現在の計算結果を返す" do
      login!

      rule_set =
        RfRuleSet.create!(
          name: "公開RFルール",
          version: 1,
          aggregation_months: 60,
          frequency_window_months: 12,
          status: "published",
          published_at: Time.current
        )

      calculation_run =
        RfCalculationRun.create!(
          rf_rule_set: rule_set,
          started_by_staff: login_staff,
          base_date: Date.new(2026, 9, 21),
          aggregation_started_on:
            Date.new(2021, 9, 21),
          frequency_started_on:
            Date.new(2025, 9, 21),
          status: "completed",
          customer_count: 10,
          excluded_count: 1,
          completed_at: Time.current
        )

      RfSetting.create!(
        current_calculation_run: calculation_run
      )

      get "/api/v1/rf_settings"

      expect(response).to have_http_status(:ok)

      data = response_body.fetch("data")

      expect(
        data.dig("published_rule_set", "id")
      ).to eq(rule_set.id)

      expect(
        data.dig("current_calculation_run", "id")
      ).to eq(calculation_run.id)

      expect(
        data.dig(
          "current_calculation_run",
          "excluded_count"
        )
      ).to eq(1)
    end

    it "計算結果が未適用の場合はnilを返す" do
      login!

      get "/api/v1/rf_settings"

      expect(response).to have_http_status(:ok)
      expect(
        response_body.dig(
          "data",
          "current_calculation_run"
        )
      ).to be_nil
    end
  end
end
