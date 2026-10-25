require "rails_helper"

RSpec.describe "Api::V1::RfAnalysis", type: :request do
  include_context "authenticated request"

  def response_body
    JSON.parse(response.body)
  end

  describe "GET /api/v1/rf_analysis" do
    it "未ログインの場合は401を返す" do
      get "/api/v1/rf_analysis"

      expect(response).to have_http_status(:unauthorized)
    end

    it "現在適用中のRF分析結果を返す" do
      login!

      rule_set =
        RfRuleSet.create!(
          name: "分析用RFルール",
          version: 1,
          aggregation_months: 60,
          frequency_window_months: 12,
          status: "published"
        )

      rank_master =
        create(
          :standard_master,
          system_key: "rf_rank",
          name: "RFランク"
        )

      rank =
        create(
          :standard_list_master,
          standard_master: rank_master,
          code: "A",
          label: "Aランク",
          position: 1,
          display_color: "#059669"
        )

      recency_rule =
        rule_set.recency_rules.create!(
          code: "R1",
          label: "0〜90日",
          min_days: 0,
          max_days: 90,
          position: 1
        )

      frequency_rule =
        rule_set.frequency_rules.create!(
          code: "F1",
          label: "1回以上",
          min_visits: 1,
          max_visits: nil,
          position: 1
        )

      rule_set.rank_mappings.create!(
        rf_recency_rule: recency_rule,
        rf_frequency_rule: frequency_rule,
        rf_rank: rank
      )

      run =
        RfCalculationRun.create!(
          rf_rule_set: rule_set,
          base_date: Date.new(2026, 10, 10),
          aggregation_started_on:
            Date.new(2021, 10, 10),
          frequency_started_on:
            Date.new(2025, 10, 10),
          status: "completed",
          customer_count: 1,
          excluded_count: 0,
          unmatched_count: 0,
          completed_at: Time.current
        )

      run.customer_rf_rank_results.create!(
        customer: create(:customer),
        rf_rank: rank,
        recency_days: 30,
        frequency_count: 3,
        last_visit_on: Date.new(2026, 9, 10)
      )

      RfSetting.create!(
        current_calculation_run: run
      )

      get "/api/v1/rf_analysis"

      expect(response).to have_http_status(:ok)

      analysis =
        response_body.dig(
          "data",
          "analysis"
        )

      expect(
        analysis.dig(
          "calculation_run",
          "id"
        )
      ).to eq(run.id)

      expect(analysis["eligible_count"]).to eq(1)

      expect(analysis["cells"]).to contain_exactly(
        include(
          "recency_rule_id" => recency_rule.id,
          "frequency_rule_id" => frequency_rule.id,
          "count" => 1,
          "percentage" => 100.0,
          "rf_rank" => include(
            "display_code" => rank.display_code,
            "label" => "Aランク",
            "display_color" => "#059669"
          )
        )
      )

      expect(
        analysis["rank_distribution"]
      ).to contain_exactly(
        include(
          "count" => 1,
          "percentage" => 100.0,
          "rf_rank" => include(
            "display_code" => rank.display_code,
            "label" => "Aランク",
            "display_color" => "#059669"
          )
        )
      )

      expect(
        analysis.dig(
          "calculation_run",
          "rule_set"
        )
      ).to include(
        "id" => rule_set.id,
        "name" => "分析用RFルール",
        "version" => 1
      )

      expect(
        analysis["unmatched_percentage"]
      ).to eq(0.0)
    end

    it "適用中の計算結果がない場合はnilを返す" do
      login!

      get "/api/v1/rf_analysis"

      expect(response).to have_http_status(:ok)

      expect(
        response_body.dig(
          "data",
          "analysis"
        )
      ).to be_nil
    end
  end
end
