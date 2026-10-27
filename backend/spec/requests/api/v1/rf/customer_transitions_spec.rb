require "rails_helper"

RSpec.describe "Api::V1::RfCustomerTransitions", type: :request do
  include_context "authenticated request"

  let(:rule_set) do
    RfRuleSet.create!(
      name: "客層変動表API用RFルール",
      version: 1,
      aggregation_months: 60,
      frequency_window_months: 12
    )
  end

  let(:previous_run) do
    create_run(base_date: Date.new(2026, 9, 1))
  end

  let(:current_run) do
    create_run(
      base_date: Date.new(2026, 10, 1),
      previous_run: previous_run
    )
  end

  def create_run(base_date:, previous_run: nil)
    RfCalculationRun.create!(
      rf_rule_set: rule_set,
      previous_run: previous_run,
      base_date: base_date,
      aggregation_started_on: base_date - 60.months,
      frequency_started_on: base_date - 12.months,
      status: "completed",
      rf_rank_snapshots: []
    )
  end

  def activate_current_run
    RfSetting.create!(
      current_calculation_run: current_run
    )
  end

  def response_data
    JSON.parse(response.body).fetch("data")
  end

  describe "GET /api/v1/rf_customer_transitions" do
    it "未ログインなら401を返す" do
      get "/api/v1/rf_customer_transitions"

      expect(response).to have_http_status(:unauthorized)
    end

    it "適用中の計算がなければ空の表を返す" do
      login!

      get "/api/v1/rf_customer_transitions"

      expect(response).to have_http_status(:ok)
      expect(response_data.fetch("table")).to eq(
        {
          "current_calculation_run_id" => nil,
          "rows" => []
        }
      )
    end

    it "適用済みの履歴だけを新しい基準日順に返す" do
      login!
      activate_current_run

      create_run(
        base_date: Date.new(2026, 10, 2),
        previous_run: current_run
      )

      get "/api/v1/rf_customer_transitions"

      expect(response).to have_http_status(:ok)

      table = response_data.fetch("table")

      expect(
        table.fetch("current_calculation_run_id")
      ).to eq(current_run.id)

      expect(
        table.fetch("rows").map do |row|
          row.fetch("calculation_run_id")
        end
      ).to eq([ current_run.id, previous_run.id ])
    end
  end

  describe "GET /api/v1/rf_customer_transitions/:id/movements" do
    it "未ログインなら401を返す" do
      get "/api/v1/rf_customer_transitions/1/movements"

      expect(response).to have_http_status(:unauthorized)
    end

    it "選択した履歴と前回の比較結果を返す" do
      login!
      activate_current_run

      get "/api/v1/rf_customer_transitions/#{current_run.id}/movements"

      expect(response).to have_http_status(:ok)
      expect(
        response_data.fetch("calculation_run_id")
      ).to eq(current_run.id)

      movement = response_data.fetch("movement")

      expect(
        movement.fetch("comparison_run_id")
      ).to eq(previous_run.id)

      expect(
        movement.fetch("counts").values.sum
      ).to eq(0)

      expect(movement.fetch("transitions")).to eq([])
    end

    it "初回の履歴は比較対象なしを返す" do
      login!
      activate_current_run

      get "/api/v1/rf_customer_transitions/#{previous_run.id}/movements"

      expect(response).to have_http_status(:ok)
      expect(response_data.fetch("movement")).to eq(
        {
          "comparison_run_id" => nil,
          "counts" => nil,
          "transitions" => []
        }
      )
    end

    it "未適用の計算履歴は404を返す" do
      login!
      activate_current_run

      unapplied_run = create_run(
        base_date: Date.new(2026, 10, 2),
        previous_run: current_run
      )

      get "/api/v1/rf_customer_transitions/#{unapplied_run.id}/movements"

      expect(response).to have_http_status(:not_found)
    end

    it "復元後に現在の履歴から外れた計算は404を返す" do
      login!
      activate_current_run

      RfSetting.first.update!(
        current_calculation_run: previous_run
      )

      get "/api/v1/rf_customer_transitions/#{current_run.id}/movements"

      expect(response).to have_http_status(:not_found)
    end
  end
end
