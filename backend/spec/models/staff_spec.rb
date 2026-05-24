require "rails_helper"

RSpec.describe Staff, type: :model do
  def build_staff_master(code: "STF001", retired_on: nil)
    StaffMaster.new(
      code: code,
      name: "オーナー",
      role_code: "owner",
      employment_started_on: Date.current,
      retired_on: retired_on
    )
  end

  describe "validations" do
    it "有効な属性で作成できること" do
      staff_master = build_staff_master

      staff = described_class.new(
        staff_master: staff_master,
        password: "password",
        password_confirmation: "password"
      )

      expect(staff).to be_valid
    end

    it "staff_masterが必須であること" do
      staff = described_class.new(
        staff_master: nil,
        password: "password",
        password_confirmation: "password"
      )

      expect(staff).to be_invalid
      expect(staff.errors[:staff_master]).to be_present
    end

    it "staff_master_idが一意であること" do
      staff_master = StaffMaster.create!(
        code: "STF001",
        name: "オーナー",
        role_code: "owner",
        employment_started_on: Date.current
      )

      described_class.create!(
        staff_master: staff_master,
        password: "password",
        password_confirmation: "password"
      )

      duplicate = described_class.new(
        staff_master: staff_master,
        password: "password",
        password_confirmation: "password"
      )

      expect(duplicate).to be_invalid
      expect(duplicate.errors[:staff_master_id]).to be_present
    end

    it "failed_attemptsは0以上であること" do
      staff = described_class.new(
        staff_master: build_staff_master,
        password: "password",
        password_confirmation: "password",
        failed_attempts: -1
      )

      expect(staff).to be_invalid
      expect(staff.errors[:failed_attempts]).to be_present
    end

    it "login_enabledはtrueまたはfalseであること" do
      staff = described_class.new(
        staff_master: build_staff_master,
        password: "password",
        password_confirmation: "password",
        login_enabled: nil
      )

      expect(staff).to be_invalid
      expect(staff.errors[:login_enabled]).to be_present
    end
  end

  describe "has_secure_password" do
    it "正しいpasswordで認証できること" do
      staff = described_class.create!(
        staff_master: StaffMaster.create!(
          code: "STF001",
          name: "オーナー",
          role_code: "owner",
          employment_started_on: Date.current
        ),
        password: "password",
        password_confirmation: "password"
      )

      expect(staff.authenticate("password")).to eq(staff)
    end

    it "誤ったpasswordでは認証できないこと" do
      staff = described_class.create!(
        staff_master: StaffMaster.create!(
          code: "STF001",
          name: "オーナー",
          role_code: "owner",
          employment_started_on: Date.current
        ),
        password: "password",
        password_confirmation: "password"
      )

      expect(staff.authenticate("wrong")).to eq(false)
    end
  end

  describe "#login_allowed?" do
    it "login_enabledがtrueかつ退職していない場合trueを返すこと" do
      staff_master = build_staff_master(retired_on: nil)

      staff = described_class.new(
        staff_master: staff_master,
        login_enabled: true
      )

      expect(staff.login_allowed?).to eq(true)
    end

    it "login_enabledがfalseの場合falseを返すこと" do
      staff_master = build_staff_master(retired_on: nil)

      staff = described_class.new(
        staff_master: staff_master,
        login_enabled: false
      )

      expect(staff.login_allowed?).to eq(false)
    end

    it "退職済みの場合falseを返すこと" do
      staff_master = build_staff_master(retired_on: Date.current)

      staff = described_class.new(
        staff_master: staff_master,
        login_enabled: true
      )

      expect(staff.login_allowed?).to eq(false)
    end
  end
end