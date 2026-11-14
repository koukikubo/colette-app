require "rails_helper"

RSpec.describe "RF rank drop predictions", type: :request do
  include_context "authenticated request"
  include_context "RF rank drop history"

  # 共通contextにより、今日は2026年11月15日に固定される。
  let(:today) { Date.new(2026, 11, 15) }

  def request_predictions(**parameters)
    get "/api/v1/rf_rank_drop_predictions", params: parameters
  end

  def response_data
    response.parsed_body.fetch("data")
  end

  # コントローラーのJSON変換を検証するための予測結果。
  # ランクや顧客は実レコードを使用する。
  def prediction_row(customer, drop_on: Date.new(2026, 12, 1))
    prediction = Rf::CustomerRankDropPredictor::Result.new(
      base_date: today,
      predicted_drop_on: drop_on,
      days_until_drop: (drop_on - today).to_i,
      current_rank: rank_a,
      predicted_rank: rank_c
    )

    Rf::RankDropPredictionList::Row.new(
      customer: customer,
      prediction: prediction
    )
  end

  it "未ログインでは401を返し、予測処理を実行しない" do
    expect(Rf::RankDropPredictionList).not_to receive(:call)

    request_predictions

    expect(response).to have_http_status(:unauthorized)
  end

  context "ログイン済みの場合" do
    before { login! }

    it "適用履歴がない場合は、予測不能と0人を区別する" do
      expect(Rf::RankDropPredictionList).not_to receive(:call)

      request_predictions

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.fetch("status")).to eq("success")
      expect(response_data).to include(
        "state" => "no_current_run",
        "base_date" => "2026-11-15",
        "until_date" => "2027-02-15",
        "current_run" => nil,
        "customers" => []
      )
      expect(response_data.fetch("pagination")).to include(
        "total_count" => nil,
        "total_pages" => nil
      )
    end

    context "適用履歴がある場合" do
      before do
        RfSetting.create!(current_calculation_run: current_run)
      end

      it "適用中ルールと今日を基準に、初期値の3か月先を渡す" do
        customer = history_customer
        row = prediction_row(customer)

        expect(Rf::RankDropPredictionList).to receive(:call).with(
          rule_set: current_run.rf_rule_set,
          base_date: today,
          until_date: Date.new(2027, 2, 15)
        ).and_return([ row ])

        request_predictions

        expect(response).to have_http_status(:ok)
        expect(response_data.fetch("state")).to eq("ready")

        # 予測基準日は今日、適用履歴の基準日は11月1日。
        # この2つを混同せず返していることを確認する。
        expect(response_data.fetch("base_date")).to eq("2026-11-15")
        expect(response_data.fetch("current_run")).to include(
          "id" => current_run.id,
          "base_date" => "2026-11-01",
          "rule_set_id" => rule_set.id
        )

        expect(response_data.fetch("customers").sole).to eq(
          "customer_id" => customer.id,
          "customer_name" => customer.name,
          "predicted_drop_on" => "2026-12-01",
          "days_until_drop" => 16,
          "current_rank" => {
            "id" => rank_a.id,
            "display_code" => rank_a.display_code,
            "label" => rank_a.label,
            "display_color" => rank_a.display_color,
            "position" => rank_a.position
          },
          "predicted_rank" => {
            "id" => rank_c.id,
            "display_code" => rank_c.display_code,
            "label" => rank_c.label,
            "display_color" => rank_c.display_color,
            "position" => rank_c.position
          }
        )
      end

      it "指定された予測期限をサービスへ渡す" do
        expect(Rf::RankDropPredictionList).to receive(:call).with(
          rule_set: current_run.rf_rule_set,
          base_date: today,
          until_date: Date.new(2027, 1, 31)
        ).and_return([])

        request_predictions(until_date: "2027-01-31")

        expect(response).to have_http_status(:ok)
        expect(response_data.fetch("until_date")).to eq("2027-01-31")
      end

      it "対象者0人をreadyと件数0で返す" do
        allow(Rf::RankDropPredictionList)
          .to receive(:call).and_return([])

        request_predictions

        expect(response).to have_http_status(:ok)
        expect(response_data.fetch("state")).to eq("ready")
        expect(response_data.fetch("customers")).to eq([])
        expect(response_data.fetch("pagination")).to eq(
          "current_page" => 1,
          "per_page" => 20,
          "total_count" => 0,
          "total_pages" => 0
        )
      end

      it "並び順を維持して2ページ目を切り出す" do
        customers = Array.new(21) { history_customer }
        rows = customers.map { |customer| prediction_row(customer) }

        allow(Rf::RankDropPredictionList)
          .to receive(:call).and_return(rows)

        request_predictions(page: "2", per_page: "20")

        expect(response).to have_http_status(:ok)
        expect(response_data.fetch("pagination")).to eq(
          "current_page" => 2,
          "per_page" => 20,
          "total_count" => 21,
          "total_pages" => 2
        )
        expect(response_data.fetch("customers").map { |row|
          row.fetch("customer_id")
        }).to eq([ customers.last.id ])
      end

      it "存在しないページは空配列を返し、総件数は維持する" do
        allow(Rf::RankDropPredictionList)
          .to receive(:call)
          .and_return([ prediction_row(history_customer) ])

        request_predictions(page: "3")

        expect(response).to have_http_status(:ok)
        expect(response_data.fetch("customers")).to eq([])
        expect(response_data.dig("pagination", "total_count")).to eq(1)
      end

      it "法人顧客は法人名を表示する" do
        customer = history_customer(
          customer_kind: "corporate",
          company_name: "株式会社テスト"
        )

        allow(Rf::RankDropPredictionList)
          .to receive(:call)
          .and_return([ prediction_row(customer) ])

        request_predictions

        expect(response).to have_http_status(:ok)
        expect(response_data.fetch("customers").sole.fetch("customer_name"))
          .to eq("株式会社テスト")
      end

      it "366日先の予測期限を受け付ける" do
        expect(Rf::RankDropPredictionList).to receive(:call).with(
          rule_set: current_run.rf_rule_set,
          base_date: today,
          until_date: today + 366
        ).and_return([])

        request_predictions(until_date: (today + 366).iso8601)

        expect(response).to have_http_status(:ok)
      end

      [ 20, 50, 100 ].each do |per_page|
        it "#{per_page}件表示を受け付ける" do
          allow(Rf::RankDropPredictionList)
            .to receive(:call).and_return([])

          request_predictions(per_page: per_page)

          expect(response).to have_http_status(:ok)
          expect(response_data.dig("pagination", "per_page"))
            .to eq(per_page)
        end
      end
    end

    # 適用履歴の有無にかかわらず、不正入力は計算前に拒否する。
    {
      "形式の違う日付" => { until_date: "2027/01/01" },
      "存在しない日付" => { until_date: "2027-02-30" },
      "今日と同じ期限" => { until_date: "2026-11-15" },
      "過去の期限" => { until_date: "2026-11-14" },
      "366日を超える期限" => { until_date: "2027-11-17" },
      "0ページ" => { page: "0" },
      "整数でないページ" => { page: "1.5" },
      "0件表示" => { per_page: "0" },
      "選択肢にない件数" => { per_page: "30" },
      "上限を超える件数" => { per_page: "101" }
    }.each do |label, parameters|
      it "#{label}を400で拒否する" do
        expect(Rf::RankDropPredictionList).not_to receive(:call)

        request_predictions(**parameters)

        expect(response).to have_http_status(:bad_request)
        expect(response.parsed_body.fetch("status")).to eq("error")
        expect(response.parsed_body.fetch("errors")).to be_present
      end
    end
  end
end
