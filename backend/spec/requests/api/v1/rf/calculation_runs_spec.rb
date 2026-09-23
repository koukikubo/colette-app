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

      preview =
        response_body.dig(
          "data",
          "calculation_run",
          "preview"
        )

      expect(preview).to include(
        "changed_count" => 0,
        "unchanged_count" => 0,
        "excluded_count" => 0
      )

      expect(preview["rank_transitions"]).to eq([])

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

  describe "GET /api/v1/rf_calculation_runs/:id/results" do
    it "未ログインの場合は401を返す" do
      get(
        "/api/v1/rf_calculation_runs/1/results",
        headers: csrf_headers
      )

      expect(response).to have_http_status(:unauthorized)
    end

    it "存在しない計算履歴の場合は404を返す" do
      login!

      get(
        "/api/v1/rf_calculation_runs/999999/results",
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:not_found)
      expect(response_body["message"])
        .to eq("データが見つかりませんでした")
    end

    it "ページ指定が不正な場合は400を返す" do
      login!

      calculation_run =
        create_completed_run(
          base_date: Date.new(2026, 9, 23)
        )

      get(
        "/api/v1/rf_calculation_runs/#{calculation_run.id}/results",
        params: {
          page: 0,
          per_page: 20
        },
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:bad_request)
      expect(response_body["message"])
        .to eq("ページ指定が不正です")
    end

    it "顧客ごとの変更前後のRFランクと判定根拠を返す" do
      login!

      rf_rank_master =
        create(
          :standard_master,
          system_key: "rf_rank",
          name: "RFランク"
        )

      rank_a =
        create(
          :standard_list_master,
          standard_master: rf_rank_master,
          code: "A",
          label: "Aランク",
          position: 1
        )

      rank_b =
        create(
          :standard_list_master,
          standard_master: rf_rank_master,
          code: "B",
          label: "Bランク",
          position: 2
        )

      customer = create(:customer)

      previous_run =
        create_completed_run(
          base_date: Date.new(2026, 8, 31)
        )

      previous_run.customer_rf_rank_results.create!(
        customer: customer,
        rf_rank: rank_b,
        recency_days: 40,
        frequency_count: 1,
        last_visit_on: Date.new(2026, 8, 1)
      )

      current_run =
        create_completed_run(
          base_date: Date.new(2026, 9, 23),
          previous_run: previous_run
        )

      current_result =
        current_run.customer_rf_rank_results.create!(
          customer: customer,
          rf_rank: rank_a,
          recency_days: 20,
          frequency_count: 3,
          last_visit_on: Date.new(2026, 9, 3)
        )

      get(
        "/api/v1/rf_calculation_runs/#{current_run.id}/results",
        params: {
          page: 1,
          per_page: 20
        },
        headers: authenticated_headers
      )

      expect(response).to have_http_status(:ok)

      result =
        response_body
          .dig("data", "results")
          .first

      expect(result).to include(
        "id" => current_result.id,
        "changed" => true,
        "recency_days" => 20,
        "frequency_count" => 3,
        "last_visit_on" => "2026-09-03",
        "exclusion_reason" => nil
      )

      expect(result["customer"]).to include(
        "id" => customer.id,
        "name" => customer.name
      )

      expect(result["previous_rf_rank"]).to include(
        "id" => rank_b.id,
        "code" => "B",
        "label" => "Bランク"
      )

      expect(result["rf_rank"]).to include(
        "id" => rank_a.id,
        "code" => "A",
        "label" => "Aランク"
      )

      expect(
        response_body.dig(
          "data",
          "pagination",
          "total_count"
        )
      ).to eq(1)
    end
  end

  describe "PATCH /api/v1/rf_calculation_runs/:id/activate" do
    let(:calculation_run) do
      RfCalculationRun.create!(
        rf_rule_set: rule_set,
        base_date: Date.new(2026, 9, 22),
        aggregation_started_on:
          Date.new(2021, 9, 22),
        frequency_started_on:
          Date.new(2025, 9, 22),
        status: "completed",
        completed_at: Time.current
      )
    end

    it "未ログインの場合は401を返す" do
      patch(
        "/api/v1/rf_calculation_runs/#{calculation_run.id}/activate",
        headers: csrf_headers,
        as: :json
      )

      expect(response).to have_http_status(:unauthorized)
    end

    it "計算完了済みの結果を現在値として適用する" do
      login!

      patch(
        "/api/v1/rf_calculation_runs/#{calculation_run.id}/activate",
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)

      setting = RfSetting.first

      expect(
        setting.current_calculation_run
      ).to eq(calculation_run)

      expect(
        response_body.dig(
          "data",
          "current_calculation_run_id"
        )
      ).to eq(calculation_run.id)
    end

    it "計算途中の結果は適用できない" do
      login!

      calculation_run.update!(
        status: "processing",
        completed_at: nil
      )

      patch(
        "/api/v1/rf_calculation_runs/#{calculation_run.id}/activate",
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(
        :unprocessable_content
      )

      expect(response_body["message"])
        .to eq("計算結果を適用できません")
    end

    it "現在値と接続していない古い結果は適用できない" do
      login!

      current_run =
        RfCalculationRun.create!(
          rf_rule_set: rule_set,
          base_date: Date.new(2026, 9, 21),
          aggregation_started_on:
            Date.new(2021, 9, 21),
          frequency_started_on:
            Date.new(2025, 9, 21),
          status: "completed",
          completed_at: Time.current
        )

      RfSetting.create!(
        current_calculation_run: current_run
      )

      patch(
        "/api/v1/rf_calculation_runs/#{calculation_run.id}/activate",
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:conflict)

      expect(
        RfSetting.first.current_calculation_run
      ).to eq(current_run)
    end

    it "存在しない計算履歴の場合は404を返す" do
      login!

      patch(
        "/api/v1/rf_calculation_runs/999999/activate",
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/rf_calculation_runs/rollback" do
    it "未ログインの場合は401を返す" do
      patch(
        "/api/v1/rf_calculation_runs/rollback",
        headers: csrf_headers,
        as: :json
      )

      expect(response).to have_http_status(:unauthorized)
    end

    it "ひとつ前の計算結果へ戻す" do
      login!

      previous_run =
        create_completed_run(
          base_date: Date.new(2026, 8, 31)
        )

      current_run =
        create_completed_run(
          base_date: Date.new(2026, 9, 22),
          previous_run: previous_run
        )

      RfSetting.create!(
        current_calculation_run: current_run
      )

      patch(
        "/api/v1/rf_calculation_runs/rollback",
        params: {
          rf_calculation: {
            expected_current_run_id: current_run.id
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)

      expect(
        RfSetting.first.current_calculation_run
      ).to eq(previous_run)

      expect(
        response_body.dig(
          "data",
          "current_calculation_run_id"
        )
      ).to eq(previous_run.id)
    end

    it "現在適用中の結果がない場合は422を返す" do
      login!

      patch(
        "/api/v1/rf_calculation_runs/rollback",
        params: {
          rf_calculation: {
            expected_current_run_id: 999_999
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(
        :unprocessable_content
      )

      expect(response_body["message"])
        .to eq("計算結果を復元できません")
    end

    it "ひとつ前の結果がない場合は422を返す" do
      login!

      current_run =
        create_completed_run(
          base_date: Date.new(2026, 9, 22)
        )

      RfSetting.create!(
        current_calculation_run: current_run
      )

      patch(
        "/api/v1/rf_calculation_runs/rollback",
        params: {
          rf_calculation: {
            expected_current_run_id: current_run.id
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(
        :unprocessable_content
      )

      expect(
        RfSetting.first.current_calculation_run
      ).to eq(current_run)
    end

    it "現在値が操作開始時から変わっている場合は復元しない" do
      login!

      previous_run =
        create_completed_run(
          base_date: Date.new(2026, 8, 31)
        )

      current_run =
        create_completed_run(
          base_date: Date.new(2026, 9, 22),
          previous_run: previous_run
        )

      RfSetting.create!(
        current_calculation_run: current_run
      )

      patch(
        "/api/v1/rf_calculation_runs/rollback",
        params: {
          rf_calculation: {
            expected_current_run_id: previous_run.id
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:conflict)

      expect(
        RfSetting.first.current_calculation_run
      ).to eq(current_run)

      expect(response_body["message"])
        .to eq("計算結果を復元できません")
    end
  end

  def create_completed_run(base_date:, previous_run: nil)
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      base_date: base_date,
      aggregation_started_on:
        base_date.advance(months: -60),
      frequency_started_on:
        base_date.advance(months: -12),
      status: "completed",
      completed_at: Time.current
    )
  end
end
