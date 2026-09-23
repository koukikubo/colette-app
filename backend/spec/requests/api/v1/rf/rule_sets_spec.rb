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

  describe "POST /api/v1/rf_rule_sets" do
    it "RFルールをdraftとして作成する" do
      login!

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

      expect do
        post(
          "/api/v1/rf_rule_sets",
          params: {
            rf_rule_set: {
              name: "新しいRFルール",
              aggregation_months: 60,
              frequency_window_months: 12,
              recency_rules: [
                {
                  code: "R1",
                  label: "90日以内",
                  min_days: 0,
                  max_days: nil,
                  position: 1
                }
              ],
              frequency_rules: [
                {
                  code: "F1",
                  label: "0回以上",
                  min_visits: 0,
                  max_visits: nil,
                  position: 1
                }
              ],
              rank_mappings: [
                {
                  recency_code: "R1",
                  frequency_code: "F1",
                  rf_rank_id: rf_rank.id
                }
              ]
            }
          },
          headers: authenticated_headers,
          as: :json
        )
      end.to change(RfRuleSet, :count).by(1)

      expect(response).to have_http_status(:created)

      rule_set = RfRuleSet.order(:id).last

      expect(rule_set).to have_attributes(
        name: "新しいRFルール",
        version: 1,
        status: "draft",
        created_by_staff_id: login_staff.id
      )

      expect(rule_set.recency_rules.count).to eq(1)
      expect(rule_set.frequency_rules.count).to eq(1)
      expect(rule_set.rank_mappings.count).to eq(1)

      response_rule_set =
        response_body.dig(
          "data",
          "rule_set"
        )

      expect(response_rule_set).to include(
        "id" => rule_set.id,
        "status" => "draft",
        "lock_version" => 0
      )

      expect(
        response_rule_set.dig(
          "created_by_staff",
          "id"
        )
      ).to eq(login_staff.id)
    end
  end

  describe "PATCH /api/v1/rf_rule_sets/:id" do
    it "draftのRFルールを更新する" do
      login!

      rule_set =
        create_rule_set(
          name: "更新前RFルール",
          version: 1,
          status: "draft"
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

      patch(
        "/api/v1/rf_rule_sets/#{rule_set.id}",
        params: {
          rf_rule_set: {
            name: "更新後RFルール",
            aggregation_months: 36,
            frequency_window_months: 6,
            lock_version: rule_set.lock_version,
            recency_rules: [
              {
                code: "R1",
                label: "90日以内",
                min_days: 0,
                max_days: nil,
                position: 1
              }
            ],
            frequency_rules: [
              {
                code: "F1",
                label: "1回以上",
                min_visits: 1,
                max_visits: nil,
                position: 1
              }
            ],
            rank_mappings: [
              {
                recency_code: "R1",
                frequency_code: "F1",
                rf_rank_id: rf_rank.id
              }
            ]
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)

      rule_set.reload

      expect(rule_set).to have_attributes(
        name: "更新後RFルール",
        aggregation_months: 36,
        frequency_window_months: 6,
        status: "draft",
        lock_version: 1
      )

      expect(rule_set.recency_rules.count).to eq(1)
      expect(rule_set.frequency_rules.count).to eq(1)
      expect(rule_set.rank_mappings.count).to eq(1)
    end
  end

  it "公開済みのRFルールは更新できない" do
    login!

    rule_set =
      create_rule_set(
        name: "公開済みRFルール",
        version: 1,
        status: "published",
        published_at: Time.current
      )

    patch(
      "/api/v1/rf_rule_sets/#{rule_set.id}",
      params: {
        rf_rule_set: {
          name: "更新後RFルール",
          aggregation_months: 36,
          frequency_window_months: 6,
          lock_version: rule_set.lock_version,
          recency_rules: [],
          frequency_rules: [],
          rank_mappings: []
        }
      },
      headers: authenticated_headers,
      as: :json
    )

    expect(response).to have_http_status(:unprocessable_content)
    expect(rule_set.reload.name).to eq("公開済みRFルール")
  end

  it "古いlock_versionでは更新できない" do
    login!

    rule_set =
      create_rule_set(
        name: "更新前RFルール",
        version: 1,
        status: "draft"
      )

    stale_lock_version = rule_set.lock_version

    rule_set.update!(
      name: "別の担当者が更新したRFルール"
    )

    patch(
      "/api/v1/rf_rule_sets/#{rule_set.id}",
      params: {
        rf_rule_set: {
          name: "古い画面からの更新",
          aggregation_months: 36,
          frequency_window_months: 6,
          lock_version: stale_lock_version,
          recency_rules: [],
          frequency_rules: [],
          rank_mappings: []
        }
      },
      headers: authenticated_headers,
      as: :json
    )

    expect(response).to have_http_status(:conflict)

    expect(rule_set.reload.name).to eq(
      "別の担当者が更新したRFルール"
    )
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
    published_at: published_at
  )
  end
end
