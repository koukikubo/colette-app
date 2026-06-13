require 'rails_helper'

RSpec.describe StandardListMaster, type: :model do
subject(:standard_list_master) do
    build(:standard_list_master)
  end

  describe "関連付け" do
    it "基本コードに所属する" do
      association =
        described_class.reflect_on_association(:standard_master)

      expect(association.macro).to eq(:belongs_to)
    end
  end

  describe "バリデーション" do
    it "有効な属性なら保存できる" do
      expect(standard_list_master).to be_valid
    end

    it "表示名が空なら無効になる" do
      standard_list_master.label = nil

      expect(standard_list_master).to be_invalid
      expect(standard_list_master.errors[:label]).to be_present
    end

    it "並び順が空なら無効になる" do
      standard_list_master.position = nil

      expect(standard_list_master).to be_invalid
      expect(standard_list_master.errors[:position]).to be_present
    end

    it "並び順が整数でなければ無効になる" do
      standard_list_master.position = 1.5

      expect(standard_list_master).to be_invalid
      expect(standard_list_master.errors[:position]).to be_present
    end

    it "activeがtrueなら有効になる" do
      standard_list_master.active = true

      expect(standard_list_master).to be_valid
    end

    it "activeがfalseでも有効になる" do
      standard_list_master.active = false

      expect(standard_list_master).to be_valid
    end

    it "activeがnilなら無効になる" do
      standard_list_master.active = nil

      expect(standard_list_master).to be_invalid
      expect(standard_list_master.errors[:active]).to be_present
    end
  end

  describe ".active" do
    let(:standard_master) { create(:standard_master) }

    let!(:active_standard_list_master) do
      create(
        :standard_list_master,
        standard_master: standard_master,
        active: true
      )
    end

    let!(:inactive_standard_list_master) do
      create(
        :standard_list_master,
        standard_master: standard_master,
        active: false
      )
    end

    it "有効な選択肢コードだけを返す" do
      expect(described_class.active).to contain_exactly(
        active_standard_list_master
      )

      expect(described_class.active).not_to include(
        inactive_standard_list_master
      )
    end
  end

  describe ".ordered" do
    let(:standard_master) { create(:standard_master) }

    let!(:third_standard_list_master) do
      create(
        :standard_list_master,
        standard_master: standard_master,
        position: 30
      )
    end

    let!(:first_standard_list_master) do
      create(
        :standard_list_master,
        standard_master: standard_master,
        position: 10
      )
    end

    let!(:second_standard_list_master) do
      create(
        :standard_list_master,
        standard_master: standard_master,
        position: 20
      )
    end

    it "positionの昇順で返す" do
      expect(described_class.ordered).to eq(
        [
          first_standard_list_master,
          second_standard_list_master,
          third_standard_list_master
        ]
      )
    end
  end
end
