require "rails_helper"

RSpec.describe "Api::V1::RfCalculationRuns",
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

  describe "POST /api/v1/rf_calculation_runs" do
    it "未ログインの場合は401を返す" do
      post(
        "/api/v1/rf_calculation_runs",
        params: {
          rf_calculation: {
            rf_rule_set_id: rule_set.id,
            base_date: "2026-09-22"
          }
        },
        headers: csrf_headers,
        as: :json
      )

      expect(response).to have_http_status(:unauthorized)
    end

    it "RFランクの計算結果を作成する" do
      login!

      calculation_run =
        RfCalculationRun.create!(
          rf_rule_set: rule_set,
          started_by_staff: login_staff,
          base_date: Date.new(2026, 9, 22),
          aggregation_started_on:
            Date.new(2021, 9, 22),
          frequency_started_on:
            Date.new(2025, 9, 22),
          status: "completed",
          completed_at: Time.current
        )

      allow(Rf::CalculationRunner)
        .to receive(:call)
        .and_return(calculation_run)

      post(
        "/api/v1/rf_calculation_runs",
        params: {
          rf_calculation: {
            rf_rule_set_id: rule_set.id,
            base_date: "2026-09-22"
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:created)

      expect(Rf::CalculationRunner)
        .to have_received(:call)
        .with(
          rule_set: rule_set,
          base_date: Date.new(2026, 9, 22),
          started_by_staff: login_staff
        )

      expect(
        response_body.dig(
          "data",
          "calculation_run",
          "id"
        )
      ).to eq(calculation_run.id)

      expect(RfSetting.count).to eq(0)
    end

    it "基準日の形式が不正な場合は400を返す" do
      login!

      post(
        "/api/v1/rf_calculation_runs",
        params: {
          rf_calculation: {
            rf_rule_set_id: rule_set.id,
            base_date: "2026/09/22"
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:bad_request)
      expect(response_body["message"])
        .to eq("基準日が不正です")
    end

    it "無効なRFルールの場合は422を返す" do
      login!

      allow(Rf::CalculationRunner)
        .to receive(:call)
        .and_raise(
          Rf::CalculationRunner::InvalidRuleSetError,
          "公開済みのRFルールを指定してください"
        )

      post(
        "/api/v1/rf_calculation_runs",
        params: {
          rf_calculation: {
            rf_rule_set_id: rule_set.id,
            base_date: "2026-09-22"
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(
        :unprocessable_content
      )

      expect(response_body["message"])
        .to eq("RFランクを計算できません")
    end
  end
end
