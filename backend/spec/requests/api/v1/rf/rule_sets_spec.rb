require "rails_helper"

RSpec.describe "Api::V1::RfRuleSets",
               type: :request do
  include_context "authenticated request"

  let(:login_staff) do
    create(
      :staff,
      staff_master:
        create(
          :staff_master,
          role_code: "owner"
        ),
      password: login_password,
      password_confirmation: login_password
    )
  end

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

  describe "POST /api/v1/rf_rule_sets/:id/validate" do
    it "有効なRFルールの検証結果を返す" do
      login!

      rule_set =
        create_rule_set(
          name: "検証対象RFルール",
          version: 1,
          status: "draft"
        )

      recency_rule =
        rule_set.recency_rules.create!(
          code: "R1",
          label: "全期間",
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

      post(
        "/api/v1/rf_rule_sets/#{rule_set.id}/validate",
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:ok)

      expect(
        response_body.dig(
          "data",
          "validation"
        )
      ).to include(
        "valid" => true,
        "errors" => [],
        "warnings" => []
      )
    end

    it "不完全なRFルールの検証エラーを返す" do
      login!

      rule_set =
        create_rule_set(
          name: "不完全なRFルール",
          version: 1,
          status: "draft"
        )

      post(
        "/api/v1/rf_rule_sets/#{rule_set.id}/validate",
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:ok)

      validation =
        response_body.dig(
          "data",
          "validation"
        )

      expect(validation["valid"]).to be(false)

      expect(
        validation["errors"].pluck("code")
      ).to contain_exactly(
        "recency_missing",
        "frequency_missing"
      )
    end
  end

  describe "PATCH /api/v1/rf_rule_sets/:id/publish" do
    it "有効なdraftを公開し、現在公開中のルールをアーカイブする" do
      login!

      current_rule_set =
        create_rule_set(
          name: "現在公開中のルール",
          version: 1,
          status: "published",
          published_at: Time.current
        )

      draft_rule_set =
        create_rule_set(
          name: "新しいルール",
          version: 2,
          status: "draft"
        )

      create_valid_rule_structure!(draft_rule_set)

      patch(
        "/api/v1/rf_rule_sets/#{draft_rule_set.id}/publish",
        params: {
          rf_rule_set: {
            lock_version: draft_rule_set.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)

      expect(draft_rule_set.reload.status).to eq("published")
      expect(draft_rule_set.published_at).to be_present
      expect(current_rule_set.reload.status).to eq("archived")
    end

    it "検証エラーがあるdraftは公開しない" do
      login!

      draft_rule_set =
        create_rule_set(
          name: "不完全なルール",
          version: 1,
          status: "draft"
        )

      patch(
        "/api/v1/rf_rule_sets/#{draft_rule_set.id}/publish",
        params: {
          rf_rule_set: {
            lock_version: draft_rule_set.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(draft_rule_set.reload.status).to eq("draft")
    end
  end

  describe "PATCH /api/v1/rf_rule_sets/:id/archive" do
    it "公開中のRFルールをアーカイブする" do
      login!

      rule_set =
        create_rule_set(
          name: "公開中のルール",
          version: 1,
          status: "published",
          published_at: Time.current
        )

      patch(
        "/api/v1/rf_rule_sets/#{rule_set.id}/archive",
        params: {
          rf_rule_set: {
            lock_version: rule_set.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)

      rule_set.reload

      expect(rule_set.status).to eq("archived")
      expect(rule_set.lock_version).to eq(1)
    end

    it "draftのRFルールはアーカイブできない" do
      login!

      rule_set =
        create_rule_set(
          name: "編集中のルール",
          version: 1,
          status: "draft"
        )

      patch(
        "/api/v1/rf_rule_sets/#{rule_set.id}/archive",
        params: {
          rf_rule_set: {
            lock_version: rule_set.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(rule_set.reload.status).to eq("draft")
    end
  end

  describe "DELETE /api/v1/rf_rule_sets/:id" do
    it "draftのRFルールを削除する" do
      login!

      rule_set =
        create_rule_set(
          name: "削除対象ルール",
          version: 1,
          status: "draft"
        )

      create_valid_rule_structure!(rule_set)

      expect do
        delete(
          "/api/v1/rf_rule_sets/#{rule_set.id}",
          params: {
            rf_rule_set: {
              lock_version: rule_set.lock_version
            }
          },
          headers: authenticated_headers,
          as: :json
        )
      end.to change(RfRuleSet, :count).by(-1)

      expect(response).to have_http_status(:no_content)
      expect(RfRecencyRule.where(rf_rule_set_id: rule_set.id)).to be_empty
      expect(RfFrequencyRule.where(rf_rule_set_id: rule_set.id)).to be_empty
      expect(RfRankMapping.where(rf_rule_set_id: rule_set.id)).to be_empty
    end

    it "公開済みのRFルールは削除できない" do
      login!

      rule_set =
        create_rule_set(
          name: "公開済みルール",
          version: 1,
          status: "published",
          published_at: Time.current
        )

      expect do
        delete(
          "/api/v1/rf_rule_sets/#{rule_set.id}",
          params: {
            rf_rule_set: {
              lock_version: rule_set.lock_version
            }
          },
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(RfRuleSet, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(RfRuleSet.exists?(rule_set.id)).to be(true)
    end
  end

  describe "権限制御" do
    context "operatorでログインしている場合" do
      let(:login_staff) do
        create(
          :staff,
          staff_master:
            create(
              :staff_master,
              role_code: "operator"
            ),
          password: login_password,
          password_confirmation: login_password
        )
      end

      it "RFルールを作成できない" do
        login!

        expect do
          post(
            "/api/v1/rf_rule_sets",
            params: {
              rf_rule_set: {
                name: "権限のないルール",
                aggregation_months: 60,
                frequency_window_months: 12,
                recency_rules: [],
                frequency_rules: [],
                rank_mappings: []
              }
            },
            headers: authenticated_headers,
            as: :json
          )
        end.not_to change(RfRuleSet, :count)

        expect(response).to have_http_status(:forbidden)

        expect(response_body).to include(
          "status" => "error",
          "message" => "この操作を行う権限がありません"
        )
      end

      it "RFルール一覧は参照できる" do
        login!

        get(
          "/api/v1/rf_rule_sets",
          headers: authenticated_headers
        )

        expect(response).to have_http_status(:ok)
      end
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
    published_at: published_at
  )
  end

  def create_valid_rule_structure!(rule_set)
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

    recency_rule =
      rule_set.recency_rules.create!(
        code: "R1",
        label: "全期間",
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

    rule_set.rank_mappings.create!(
      rf_recency_rule: recency_rule,
      rf_frequency_rule: frequency_rule,
      rf_rank: rf_rank
    )
  end
end
