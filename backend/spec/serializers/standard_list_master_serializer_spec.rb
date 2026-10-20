require "rails_helper"

RSpec.describe Api::V1::StandardListMasterSerializer do
  def serialize_rank(code:, system_key: "rf_rank")
    master = build(
      :standard_master,
      system_key: system_key
    )

    rank = build(
      :standard_list_master,
      standard_master: master,
      code: code,
      label: "変更された表示名",
      display_color: "#FF0000"
    )

    described_class.new(rank).as_json
  end

  it "RFランクの現在色とコードに対応する初期色を返す" do
    StandardListMaster::RF_RANK_DEFAULT_COLORS.each do |code, color|
      data = serialize_rank(code: code)

      expect(data[:display_color]).to eq("#FF0000")
      expect(data[:default_display_color]).to eq(color)
    end
  end

  it "独自RFランクの初期色は灰色を返す" do
    data = serialize_rank(code: "S")

    expect(data[:default_display_color]).to eq("#64748B")
  end

  it "RFランク以外には初期色を追加しない" do
    data = serialize_rank(
      code: "A",
      system_key: "customer_rank"
    )

    expect(data).not_to have_key(:default_display_color)
  end
end
