require "rails_helper"

RSpec.describe Customers::SearchQuery do
  describe "#call" do
    subject(:result) do
      described_class.new(
        relation: relation,
        keyword: keyword
      ).call
    end

    let(:relation) { Customer.all }

    describe "文字列検索" do
      search_cases = {
        name: {
          value: "検索対象 太郎",
          keyword: "検索対象"
        },
        kana: {
          value: "ケンサクタイショウ タロウ",
          keyword: "ケンサクタイショウ"
        },
        email: {
          value: "search-target@example.com",
          keyword: "search-target"
        },
        company_name: {
          value: "検索対象株式会社",
          keyword: "検索対象株式会社"
        },
        company_name_kana: {
          value: "ケンサクタイショウカブシキガイシャ",
          keyword: "ケンサクタイショウカブシキガイシャ"
        },
        company_email: {
          value: "company-search@example.com",
          keyword: "company-search"
        }
      }.freeze

      search_cases.each do |attribute, condition|
        context "#{attribute}に検索文字列が含まれる場合" do
          let!(:target_customer) do
            create(
              :customer,
              attribute => condition[:value]
            )
          end

          let!(:other_customer) do
            create(
              :customer,
              name: "一致しない顧客",
              kana: "イッチシナイコキャク",
              email: nil,
              company_name: nil,
              company_name_kana: nil,
              company_email: nil
            )
          end

          let(:keyword) { condition[:keyword] }

          it "該当する顧客だけを返す" do
            expect(result).to contain_exactly(target_customer)
          end
        end
      end
    end

    describe "大文字と小文字" do
      let!(:target_customer) do
        create(
          :customer,
          company_name: "COLETTE株式会社"
        )
      end

      let!(:other_customer) do
        create(
          :customer,
          company_name: "株式会社浅井"
        )
      end

      let(:keyword) { "colette" }

      it "大文字と小文字を区別せず検索する" do
        expect(result).to contain_exactly(target_customer)
      end
    end

    describe "電話番号検索" do
      let!(:target_customer) do
        create(
          :customer,
          phone_number: "09012345678",
          company_phone_number: "0661234567"
        )
      end

      let!(:other_customer) do
        create(
          :customer,
          phone_number: "08099999999",
          company_phone_number: "0759999999"
        )
      end

      context "個人電話番号をハイフン付きで検索した場合" do
        let(:keyword) { "090-1234-5678" }

        it "数字だけに変換して該当顧客を返す" do
          expect(result).to contain_exactly(target_customer)
        end
      end

      context "法人電話番号を括弧付きで検索した場合" do
        let(:keyword) { "(06) 6123-4567" }

        it "数字だけに変換して該当顧客を返す" do
          expect(result).to contain_exactly(target_customer)
        end
      end

      context "電話番号の一部で検索した場合" do
        let(:keyword) { "1234" }

        it "部分一致する顧客を返す" do
          expect(result).to contain_exactly(target_customer)
        end
      end
    end

    describe "空の検索文字列" do
      let!(:first_customer) { create(:customer) }
      let!(:second_customer) { create(:customer) }

      shared_examples "すべての顧客を返す" do
        it "渡されたRelationを変更しない" do
          expect(result).to contain_exactly(
            first_customer,
            second_customer
          )
        end
      end

      context "nilの場合" do
        let(:keyword) { nil }

        include_examples "すべての顧客を返す"
      end

      context "空文字の場合" do
        let(:keyword) { "" }

        include_examples "すべての顧客を返す"
      end

      context "空白だけの場合" do
        let(:keyword) { "   " }

        include_examples "すべての顧客を返す"
      end
    end

    describe "LIKE検索の特殊文字" do
      context "%を検索した場合" do
        let!(:target_customer) do
          create(
            :customer,
            name: "達成率100%の顧客"
          )
        end

        let!(:other_customer) do
          create(
            :customer,
            name: "通常の顧客"
          )
        end

        let(:keyword) { "%" }

        it "%をワイルドカードではなく文字として検索する" do
          expect(result).to contain_exactly(target_customer)
        end
      end

      context "_を検索した場合" do
        let!(:target_customer) do
          create(
            :customer,
            name: "CUSTOMER_001"
          )
        end

        let!(:other_customer) do
          create(
            :customer,
            name: "CUSTOMERX001"
          )
        end

        let(:keyword) { "_" }

        it "_をワイルドカードではなく文字として検索する" do
          expect(result).to contain_exactly(target_customer)
        end
      end
    end

    describe "Relationの引き継ぎ" do
      let!(:individual_customer) do
        create(
          :customer,
          customer_kind: "individual",
          name: "検索対象 個人"
        )
      end

      let!(:corporate_customer) do
        create(
          :customer,
          :corporate,
          name: "検索対象 法人"
        )
      end

      let(:relation) do
        Customer.where(customer_kind: "corporate")
      end

      let(:keyword) { "検索対象" }

      it "事前に設定された絞り込み条件を維持する" do
        expect(result).to contain_exactly(corporate_customer)
      end
    end

    describe "該当する顧客が存在しない場合" do
      let!(:customer) { create(:customer) }
      let(:keyword) { "存在しない検索文字列" }

      it "空のRelationを返す" do
        expect(result).to be_empty
      end
    end
  end
end