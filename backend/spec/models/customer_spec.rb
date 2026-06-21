require "rails_helper"

RSpec.describe Customer, type: :model do
  subject(:customer) { build(:customer) }

  describe "関連付け" do
    it "登録担当者としてStaffに所属する" do
      association =
        described_class.reflect_on_association(:created_by_staff)

      expect(association.macro).to eq(:belongs_to)
      expect(association.class_name).to eq("Staff")
      expect(association.foreign_key).to eq("created_by_staff_id")
    end

    it "更新担当者としてStaffに所属する" do
      association =
        described_class.reflect_on_association(:updated_by_staff)

      expect(association.macro).to eq(:belongs_to)
      expect(association.class_name).to eq("Staff")
      expect(association.foreign_key).to eq("updated_by_staff_id")
    end
  end

  describe "バリデーション" do
    it "有効な属性なら保存できる" do
      expect(customer).to be_valid
    end

    describe "顧客区分" do
      it "individualなら有効になる" do
        customer.customer_kind = "individual"

        expect(customer).to be_valid
      end

      it "corporateなら有効になる" do
        customer.customer_kind = "corporate"

        expect(customer).to be_valid
      end

      it "空なら無効になる" do
        customer.customer_kind = nil

        expect(customer).to be_invalid
        expect(customer.errors[:customer_kind]).to be_present
      end

      it "定義されていない値なら無効になる" do
        customer.customer_kind = "unknown"

        expect(customer).to be_invalid
        expect(customer.errors[:customer_kind]).to be_present
      end
    end

    describe "氏名" do
      it "空なら無効になる" do
        customer.name = nil

        expect(customer).to be_invalid
        expect(customer.errors[:name]).to be_present
      end

      it "30文字なら有効になる" do
        customer.name = "山" * 30

        expect(customer).to be_valid
      end

      it "31文字なら無効になる" do
        customer.name = "山" * 31

        expect(customer).to be_invalid
        expect(customer.errors[:name]).to be_present
      end
    end

    describe "氏名カナ" do
      it "空なら無効になる" do
        customer.kana = nil

        expect(customer).to be_invalid
        expect(customer.errors[:kana]).to be_present
      end

      it "全角カタカナなら有効になる" do
        customer.kana = "ヤマダ タロウ"

        expect(customer).to be_valid
      end

      it "全角スペースを含んでも有効になる" do
        customer.kana = "ヤマダ　タロウ"

        expect(customer).to be_valid
      end

      it "ひらがなを含む場合は無効になる" do
        customer.kana = "やまだ タロウ"

        expect(customer).to be_invalid
        expect(customer.errors[:kana]).to be_present
      end

      it "31文字なら無効になる" do
        customer.kana = "ア" * 31

        expect(customer).to be_invalid
        expect(customer.errors[:kana]).to be_present
      end
    end

    describe "法人情報" do
      it "法人情報が空でも有効になる" do
        customer.company_name = nil
        customer.company_name_kana = nil

        expect(customer).to be_valid
      end

      it "法人名が101文字なら無効になる" do
        customer.company_name = "株" * 101

        expect(customer).to be_invalid
        expect(customer.errors[:company_name]).to be_present
      end

      it "法人名カナにひらがなを含む場合は無効になる" do
        customer.company_name_kana = "かぶしきガイシャ"

        expect(customer).to be_invalid
        expect(customer.errors[:company_name_kana]).to be_present
      end
    end

    describe "郵便番号" do
      %i[postal_code company_postal_code].each do |attribute|
        it "#{attribute}が7桁なら有効になる" do
          customer.public_send("#{attribute}=", "5300001")

          expect(customer).to be_valid
        end

        it "#{attribute}が6桁なら無効になる" do
          customer.public_send("#{attribute}=", "530001")

          expect(customer).to be_invalid
          expect(customer.errors[attribute]).to be_present
        end

        it "#{attribute}が空でも有効になる" do
          customer.public_send("#{attribute}=", nil)

          expect(customer).to be_valid
        end
      end
    end

    describe "電話番号" do
      %i[phone_number company_phone_number].each do |attribute|
        it "#{attribute}が10桁なら有効になる" do
          customer.public_send("#{attribute}=", "0661234567")

          expect(customer).to be_valid
        end

        it "#{attribute}が11桁なら有効になる" do
          customer.public_send("#{attribute}=", "09012345678")

          expect(customer).to be_valid
        end

        it "#{attribute}が9桁なら無効になる" do
          customer.public_send("#{attribute}=", "061234567")

          expect(customer).to be_invalid
          expect(customer.errors[attribute]).to be_present
        end

        it "#{attribute}に英字が含まれる場合は無効になる" do
          customer.public_send("#{attribute}=", "090-ABC-5678")

          expect(customer).to be_invalid
          expect(customer.errors[attribute]).to be_present
        end
      end
    end

    describe "メールアドレス" do
      %i[email company_email].each do |attribute|
        it "#{attribute}が正しい形式なら有効になる" do
          customer.public_send(
            "#{attribute}=",
            "customer@example.com"
          )

          expect(customer).to be_valid
        end

        it "#{attribute}が不正な形式なら無効になる" do
          customer.public_send(
            "#{attribute}=",
            "invalid-email"
          )

          expect(customer).to be_invalid
          expect(customer.errors[attribute]).to be_present
        end

        it "#{attribute}が空でも有効になる" do
          customer.public_send("#{attribute}=", nil)

          expect(customer).to be_valid
        end
      end
    end

    describe "誕生日" do
      it "今日なら有効になる" do
        customer.birthday = Date.current

        expect(customer).to be_valid
      end

      it "過去の日付なら有効になる" do
        customer.birthday = Date.current.yesterday

        expect(customer).to be_valid
      end

      it "未来の日付なら無効になる" do
        customer.birthday = Date.current.tomorrow

        expect(customer).to be_invalid
        expect(customer.errors[:birthday]).to be_present
      end

      it "空でも有効になる" do
        customer.birthday = nil

        expect(customer).to be_valid
      end
    end

    describe "担当者" do
      it "登録担当者が空なら無効になる" do
        customer.created_by_staff = nil

        expect(customer).to be_invalid
        expect(customer.errors[:created_by_staff]).to be_present
      end

      it "更新担当者が空なら無効になる" do
        customer.updated_by_staff = nil

        expect(customer).to be_invalid
        expect(customer.errors[:updated_by_staff]).to be_present
      end
    end
  end

  describe "入力値の正規化" do
    it "氏名とカナの前後空白を削除する" do
      customer.name = "  山田 太郎  "
      customer.kana = "  ヤマダ タロウ  "

      customer.valid?

      expect(customer.name).to eq("山田 太郎")
      expect(customer.kana).to eq("ヤマダ タロウ")
    end

    it "メールアドレスの前後空白を削除して小文字にする" do
      customer.email = "  TARO@EXAMPLE.COM  "
      customer.company_email = "  COMPANY@EXAMPLE.COM  "

      customer.valid?

      expect(customer.email).to eq("taro@example.com")
      expect(customer.company_email).to eq(
        "company@example.com"
      )
    end

    it "郵便番号のハイフンを削除する" do
      customer.postal_code = "530-0001"
      customer.company_postal_code = "542-0081"

      customer.valid?

      expect(customer.postal_code).to eq("5300001")
      expect(customer.company_postal_code).to eq("5420081")
    end

    it "電話番号の記号と空白を削除する" do
      customer.phone_number = "090-1234-5678"
      customer.company_phone_number = "(06) 6123-4567"

      customer.valid?

      expect(customer.phone_number).to eq("09012345678")
      expect(customer.company_phone_number).to eq("0661234567")
    end

    it "全角数字を半角数字へ変換する" do
      customer.postal_code = "５３０－０００１"
      customer.phone_number = "０９０－１２３４－５６７８"

      customer.valid?

      expect(customer.postal_code).to eq("5300001")
      expect(customer.phone_number).to eq("09012345678")
    end

    it "任意項目の空文字をnilへ変換する" do
      customer.company_name = " "
      customer.company_name_kana = "　"
      customer.address = " "
      customer.company_address = ""
      customer.memo = " "

      customer.valid?

      expect(customer.company_name).to be_nil
      expect(customer.company_name_kana).to be_nil
      expect(customer.address).to be_nil
      expect(customer.company_address).to be_nil
      expect(customer.memo).to be_nil
    end

    it "電話番号に含まれる英字は削除しない" do
      customer.phone_number = "090-ABC-5678"

      customer.valid?

      expect(customer.phone_number).to eq("090ABC5678")
      expect(customer.errors[:phone_number]).to be_present
    end
  end
end