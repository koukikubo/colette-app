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

  describe "RFランクの識別情報" do
    let(:rf_rank_master) do
      create(
        :standard_master,
        system_key: "rf_rank"
      )
    end

    let(:rf_rank) do
      create(
        :standard_list_master,
        standard_master: rf_rank_master,
        code: "A"
      )
    end

    it "RFランクを新規登録できる" do
      rank = build(
        :standard_list_master,
        standard_master: rf_rank_master,
        code: "S"
      )

      expect(rank.save).to be true
    end

    it "旧コードを消してもIDと表示用コードを維持する" do
      original_id = rf_rank.id
      original_display_code = rf_rank.display_code

      expect(rf_rank.update(code: nil)).to be true
      expect(rf_rank.reload.id).to eq(original_id)
      expect(rf_rank.display_code).to eq(original_display_code)
    end

    it "RFランクを無効化できる" do
      expect(rf_rank.update(active: false)).to be true
      expect(rf_rank.reload.active).to be false
    end

    it "RFランク以外のコード変更には影響しない" do
      master = create(
        :standard_master,
        system_key: "customer_rank"
      )
      rank = create(
        :standard_list_master,
        standard_master: master,
        code: "A"
      )

      expect(rank.update(code: "S")).to be true
      expect(rank.reload.code).to eq("S")
    end
  end

  describe "RFランクの初期色" do
    let(:master) { create(:standard_master, system_key: "rf_rank") }

    it "コードなしで登録しても登録時の表示色を初期色として保存する" do
      rank = create(:standard_list_master, standard_master: master,
                    code: nil, display_color: "#123456")

      expect(rank.reload.default_display_color).to eq("#123456")
      rank.update!(display_color: "#ABCDEF", label: "改名後")
      expect(rank.reload.default_display_color).to eq("#123456")
    end

    it "表示色が未指定なら共通初期色を保存する" do
      rank = create(:standard_list_master, standard_master: master, code: nil)

      expect(rank.reload.initial_display_color).to eq("#64748B")
    end

    it "明示された初期色を保持する" do
      rank = create(:standard_list_master, standard_master: master,
                    initial_display_color: "#654321", display_color: "#123456")

      expect(rank.reload.default_display_color).to eq("#654321")
    end

    it "初期色の形式を検証する" do
      rank = build(:standard_list_master, standard_master: master,
                   initial_display_color: "red")

      expect(rank).to be_invalid
      expect(rank.errors[:initial_display_color]).to be_present
    end

    it "RFランク以外には初期色を自動設定しない" do
      rank = create(:standard_list_master, display_color: "#123456")

      expect(rank.reload.initial_display_color).to be_nil
      expect(rank.default_display_color).to be_nil
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

    it "表示色が#RRGGBB形式なら有効になる" do
      standard_list_master.display_color = "#12ABEF"

      expect(standard_list_master).to be_valid
    end

    it "表示色がnilでも有効になる" do
      standard_list_master.display_color = nil

      expect(standard_list_master).to be_valid
    end

    it "表示色が#RRGGBB形式でなければ無効になる" do
      invalid_colors = [
        "red",
        "#FFF",
        "059669",
        "#GGGGGG"
      ]

      invalid_colors.each do |color|
        standard_list_master.display_color = color

        expect(standard_list_master).to be_invalid
        expect(
          standard_list_master.errors[:display_color]
        ).to be_present
      end
    end
  end
end
