require 'rails_helper'

RSpec.describe StandardMaster, type: :model do
  subject(:standard_master) { build(:standard_master) }

  describe "関連付け" do
    it "選択肢コードを複数保持する" do
      association =
        described_class.reflect_on_association(:standard_list_masters)

      expect(association.macro).to eq(:has_many)
    end
  end

  describe "バリデーション" do
    it "有効な属性なら保存できる" do
      expect(standard_master).to be_valid
    end

    it "名称が空なら無効になる" do
      standard_master.name = nil

      expect(standard_master).to be_invalid
      expect(standard_master.errors[:name]).to be_present
    end

    it "並び順が空なら無効になる" do
      standard_master.position = nil

      expect(standard_master).to be_invalid
      expect(standard_master.errors[:position]).to be_present
    end

    it "並び順が整数でなければ無効になる" do
      standard_master.position = 1.5

      expect(standard_master).to be_invalid
      expect(standard_master.errors[:position]).to be_present
    end

    it "activeがtrueなら有効になる" do
      standard_master.active = true

      expect(standard_master).to be_valid
    end

    it "activeがfalseでも有効になる" do
      standard_master.active = false

      expect(standard_master).to be_valid
    end

    it "activeがnilなら無効になる" do
      standard_master.active = nil

      expect(standard_master).to be_invalid
      expect(standard_master.errors[:active]).to be_present
    end
  end

  describe ".active" do
    let!(:active_standard_master) do
      create(:standard_master, active: true)
    end

    let!(:inactive_standard_master) do
      create(:standard_master, active: false)
    end

    it "有効な基本コードだけを返す" do
      expect(described_class.active).to contain_exactly(
        active_standard_master
      )

      expect(described_class.active).not_to include(
        inactive_standard_master
      )
    end
  end

  describe ".ordered" do
    let!(:third_standard_master) do
      create(:standard_master, position: 30)
    end

    let!(:first_standard_master) do
      create(:standard_master, position: 10)
    end

    let!(:second_standard_master) do
      create(:standard_master, position: 20)
    end

    it "positionの昇順で返す" do
      expect(described_class.ordered).to eq(
        [
          first_standard_master,
          second_standard_master,
          third_standard_master
        ]
      )
    end
  end

  describe ".search" do
    let!(:reservation_status) do
      create(
        :standard_master,
        name: "予約状態",
        description: "予約ステータス管理",
        active: true
      )
    end

    let!(:visit_route) do
      create(
        :standard_master,
        name: "来店経路",
        description: "流入経路管理",
        active: false
      )
    end

    it "名称で検索できる" do
      result = described_class.search(query: "予約")

      expect(result).to contain_exactly(reservation_status)
    end

    it "説明で検索できる" do
      result = described_class.search(query: "流入")

      expect(result).to contain_exactly(visit_route)
    end

    it "有効データだけに絞り込める" do
      result = described_class.search(active: "true")

      expect(result).to include(reservation_status)
      expect(result).not_to include(visit_route)
    end

    it "無効データだけに絞り込める" do
      result = described_class.search(active: "false")

      expect(result).to contain_exactly(visit_route)
    end
  end
end
