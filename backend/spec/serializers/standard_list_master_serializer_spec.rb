require "rails_helper"

RSpec.describe Api::V1::StandardListMasterSerializer do
  def serialize_rank(code:, system_key: "rf_rank", initial_display_color: nil)
    master = build(
      :standard_master,
      system_key: system_key
    )

    rank = build(
      :standard_list_master,
      standard_master: master,
      code: code,
      label: "変更された表示名",
      display_color: "#FF0000",
      initial_display_color: initial_display_color
    )

    described_class.new(rank).as_json
  end

  it "旧コードに依存せず保存済みの初期色と現在色を返す" do
    [ "A", "S", nil ].each do |code|
      data = serialize_rank(code: code, initial_display_color: "#123456")

      expect(data[:display_color]).to eq("#FF0000")
      expect(data[:default_display_color]).to eq("#123456")
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
