require "rails_helper"

RSpec.describe ApiContractSignature do
  %w[state latest_state reason future_enum].each do |field|
    it "#{field}の値の違いを捨てない" do
      expect(described_class.call(field => "known")).not_to eq(described_class.call(field => "incompatible"))
    end
  end

  it "文字列の値と型マーカーを混同しない" do
    expect(described_class.call("reason" => "number")).not_to eq(described_class.call("reason" => 2))
  end

  it "キー順・数値IDだけの違いは重複排除する" do
    expect(described_class.call("id" => 1, "state" => "ready")).to eq(described_class.call("state" => "ready", "id" => 2))
  end
end
