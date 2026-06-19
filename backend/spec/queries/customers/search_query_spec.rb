require "rails_helper"

RSpec.describe Customers::SearchQuery do
  describe "#call" do
    subject(:result) do
      described_class.new(
        relation: Customer.all,
        keyword: keyword
      ).call
    end

    let(:staff) { create(:staff) }

    let!(:target_customer) do
      create(
        :customer,
        name: "久保 光輝",
        kana: "クボ コウキ",
        phone_number: "09012345678",
        created_by_staff: staff,
        updated_by_staff: staff
      )
    end

    let!(:other_customer) do
      create(
        :customer,
        name: "山田 太郎",
        kana: "ヤマダ タロウ",
        phone_number: "08099999999",
        created_by_staff: staff,
        updated_by_staff: staff
      )
    end

    context "氏名に検索文字列が含まれる場合" do
      let(:keyword) { "久保" }

      it "該当する顧客だけを返す" do
        expect(result).to contain_exactly(target_customer)
      end
    end

    context "ハイフン付き電話番号で検索した場合" do
      let(:keyword) { "090-1234-5678" }

      it "数字だけに正規化して検索する" do
        expect(result).to contain_exactly(target_customer)
      end
    end

    context "検索文字列が空の場合" do
      let(:keyword) { "" }

      it "渡されたRelationをそのまま返す" do
        expect(result).to contain_exactly(
          target_customer,
          other_customer
        )
      end
    end

    context "該当する顧客がいない場合" do
      let(:keyword) { "存在しない顧客" }

      it "空のRelationを返す" do
        expect(result).to be_empty
      end
    end
  end
end