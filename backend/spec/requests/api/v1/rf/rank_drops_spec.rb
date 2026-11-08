require "rails_helper"

RSpec.describe "RF rank drops", type: :request do
  include_context "authenticated request"
  include_context "RF rank drop history"

  # 実際のルートへGETし、ルーティング・認証・サービス・JSONをまとめて検証する。
  def request_rank_drops(**parameters)
    get "/api/v1/rf_rank_drops", params: parameters
  end

  it "未ログインでは401を返す" do
    request_rank_drops

    expect(response).to have_http_status(:unauthorized)
  end

  it "ログイン済みなら低下顧客と比較情報を返す" do
    login!
    customer = customer_with_change(from: rank_a, to: rank_c)
    RfSetting.create!(current_calculation_run: current_run)

    request_rank_drops

    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("data")
    row = data.fetch("customers").first

    expect(data.fetch("state")).to eq("ready")
    expect(data.dig("pagination", "total_count")).to eq(1)
    expect(row).to include(
      "customer_id" => customer.id,
      "customer_name" => customer.name,
      "detected_on" => "2026-11-01"
    )
    expect(row.dig("previous_rank", "id")).to eq(rank_a.id)
    expect(row.dig("dropped_rank", "id")).to eq(rank_c.id)
    expect(row.dig("latest_rank", "id")).to eq(rank_c.id)
  end

  it "ページと50件表示の指定をサービスへ渡す" do
    login!
    customer_with_change(from: rank_a, to: rank_c)
    RfSetting.create!(current_calculation_run: current_run)

    request_rank_drops(page: "2", per_page: "50")

    expect(response).to have_http_status(:ok)
    data = response.parsed_body.fetch("data")

    expect(data.fetch("pagination")).to include(
      "current_page" => 2,
      "per_page" => 50,
      "total_count" => 1,
      "total_pages" => 1
    )
    expect(data.fetch("customers")).to be_empty
  end

  it "期間指定をサービスへ渡す" do
    login!
    customer_with_change(from: rank_a, to: rank_c)
    RfSetting.create!(current_calculation_run: current_run)

    request_rank_drops(
      start_date: "2026-11-02",
      end_date: "2026-11-15"
    )

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "state"))
      .to eq("no_history_in_period")
  end

  it "適用履歴がない場合も正常レスポンスで状態を返す" do
    login!

    request_rank_drops

    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "state")).to eq("no_current_run")
    expect(response.parsed_body.dig("data", "pagination", "total_count"))
      .to be_nil
  end

  [
    { page: "0" },
    { per_page: "21" },
    { per_page: "101" },
    { start_date: "invalid" },
    { start_date: "2026-11-10", end_date: "2026-11-01" },
    { end_date: "2026-11-16" }
  ].each do |parameters|
    it "不正な検索条件#{parameters.inspect}には400を返す" do
      login!

      request_rank_drops(**parameters)

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body.fetch("status")).to eq("error")
    end
  end

  it "比較元の履歴が未完了なら422を返す" do
    login!
    customer_with_change(from: rank_a, to: rank_c)
    RfSetting.create!(current_calculation_run: current_run)
    previous_run.update!(status: "failed")

    request_rank_drops

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body.fetch("message"))
      .to eq("RFランク低下顧客を取得できません")
  end

  it "必要なランク情報が欠けている場合は422を返す" do
    login!
    customer_with_change(from: rank_a, to: rank_c)
    RfSetting.create!(current_calculation_run: current_run)

    snapshots = current_run.rf_rank_snapshots.reject do |rank|
      rank.fetch("id") == rank_c.id
    end
    current_run.update!(rf_rank_snapshots: snapshots)

    request_rank_drops

    expect(response).to have_http_status(:unprocessable_content)
  end
end
