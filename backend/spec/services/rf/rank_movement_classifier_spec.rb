require "rails_helper"

RSpec.describe Rf::RankMovementClassifier do
  it "同じランクIDなら表示順が変わっても維持と判定する" do
    result = described_class.call(
      previous_rank: { id: 1, position: 1 },
      current_rank: { id: 1, position: 3 }
    )

    expect(result).to eq(:unchanged)
  end

  it "今回の表示順が小さければ上昇と判定する" do
    result = described_class.call(
      previous_rank: { id: 2, position: 2 },
      current_rank: { id: 1, position: 1 }
    )

    expect(result).to eq(:up)
  end

  it "今回の表示順が大きければ下降と判定する" do
    result = described_class.call(
      previous_rank: { id: 1, position: 1 },
      current_rank: { id: 2, position: 2 }
    )

    expect(result).to eq(:down)
  end

  it "異なるランクIDで表示順が同じなら同順位の移動と判定する" do
    result = described_class.call(
      previous_rank: { id: 1, position: 2 },
      current_rank: { id: 2, position: 2 }
    )

    expect(result).to eq(:same_position)
  end
end
