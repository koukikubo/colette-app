require "rails_helper"

RSpec.describe "Api::V1::RfRuleSets",
               type: :request do
  include_context "authenticated request"

  def response_body
    JSON.parse(response.body)
  end

  describe "GET /api/v1/rf_rule_sets" do
    it "未ログインの場合は401を返す" do
      get(
        "/api/v1/rf_rule_sets",
        headers: csrf_headers
      )

      expect(response).to have_http_status(:unauthorized)
    end

    it "RFルールをバージョンの新しい順に返す" do
      login!

      published_rule_set =
        create_rule_set(
          name: "公開中RFルール",
          version: 1,
          status: "published",
          published_at: Time.current
        )

      draft_rule_set =
        create_rule_set(
          name: "編集中RFルール",
          version: 2,
          status: "draft"
        )

      get(
        "/api/v1/rf_rule_sets",
        params: {
          page: 1,
          per_page: 20
        },
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:ok)

      rule_sets =
        response_body.dig(
          "data",
          "rule_sets"
        )

      expect(
        rule_sets.pluck("id")
      ).to eq(
        [
          draft_rule_set.id,
          published_rule_set.id
        ]
      )

      expect(rule_sets.first).to include(
        "id" => draft_rule_set.id,
        "name" => "編集中RFルール",
        "version" => 2,
        "status" => "draft"
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

  describe "GET /api/v1/rf_rule_sets/:id" do
    it "RFルールの条件とランク対応表を返す" do
      login!

      rule_set =
        create_rule_set(
          name: "RFルール",
          version: 1,
          status: "draft"
        )

      recency_rule =
        rule_set.recency_rules.create!(
          code: "R1",
          label: "90日以内",
          min_days: 0,
          max_days: nil,
          position: 1
        )

      frequency_rule =
        rule_set.frequency_rules.create!(
          code: "F1",
          label: "0回以上",
          min_visits: 0,
          max_visits: nil,
          position: 1
        )

      rf_rank_master =
        create(
          :standard_master,
          system_key: "rf_rank",
          name: "RFランク"
        )

      rf_rank =
        create(
          :standard_list_master,
          standard_master: rf_rank_master,
          code: "A",
          label: "Aランク",
          position: 1
        )

      rule_set.rank_mappings.create!(
        rf_recency_rule: recency_rule,
        rf_frequency_rule: frequency_rule,
        rf_rank: rf_rank
      )

      get(
        "/api/v1/rf_rule_sets/#{rule_set.id}",
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:ok)

      response_rule_set =
        response_body.dig(
          "data",
          "rule_set"
        )

      expect(response_rule_set).to include(
        "id" => rule_set.id,
        "name" => "RFルール",
        "version" => 1,
        "aggregation_months" => 60,
        "frequency_window_months" => 12,
        "status" => "draft"
      )

      expect(
        response_rule_set["recency_rules"].first
      ).to include(
        "id" => recency_rule.id,
        "code" => "R1",
        "min_days" => 0,
        "max_days" => nil
      )

      expect(
        response_rule_set["frequency_rules"].first
      ).to include(
        "id" => frequency_rule.id,
        "code" => "F1",
        "min_visits" => 0,
        "max_visits" => nil
      )

      expect(
        response_rule_set
          .dig("rank_mappings", 0, "rf_rank")
      ).to include(
        "id" => rf_rank.id,
        "code" => "A",
        "label" => "Aランク"
      )
    end

    it "存在しないRFルールの場合は404を返す" do
      login!

      get(
        "/api/v1/rf_rule_sets/999999",
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:not_found)
    end
  end

  private

  def create_rule_set(
    name:,
    version:,
    status:,
    published_at: nil
  )
    RfRuleSet.create!(
      name: name,
      version: version,
      aggregation_months: 60,
      frequency_window_months: 12,
      status: status,
      published_at: published_at,
      created_by_staff:
        status == "draft" ? nil : nil
    )
  end
end
