require "rails_helper"

RSpec.describe StaffMaster, type: :model do
  describe "validations" do
    it "有効な属性で作成できること" do
      staff_master = described_class.new(
        code: "STF001",
        name: "オーナー",
        role_code: "owner",
        employment_started_on: Date.current
      )

      expect(staff_master).to be_valid
    end

    it "codeが必須であること" do
      staff_master = described_class.new(
        code: nil,
        name: "オーナー",
        role_code: "owner",
        employment_started_on: Date.current
      )

      expect(staff_master).to be_invalid
      expect(staff_master.errors[:code]).to be_present
    end

    it "codeが一意であること" do
      described_class.create!(
        code: "STF001",
        name: "オーナー",
        role_code: "owner",
        employment_started_on: Date.current
      )

      duplicate = described_class.new(
        code: "STF001",
        name: "別スタッフ",
        role_code: "operator",
        employment_started_on: Date.current
      )

      expect(duplicate).to be_invalid
      expect(duplicate.errors[:code]).to be_present
    end

    it "nameが必須であること" do
      staff_master = described_class.new(
        code: "STF001",
        name: nil,
        role_code: "owner",
        employment_started_on: Date.current
      )

      expect(staff_master).to be_invalid
      expect(staff_master.errors[:name]).to be_present
    end

    it "role_codeが必須であること" do
      staff_master = described_class.new(
        code: "STF001",
        name: "オーナー",
        role_code: nil,
        employment_started_on: Date.current
      )

      expect(staff_master).to be_invalid
      expect(staff_master.errors[:role_code]).to be_present
    end

    it "employment_started_onが必須であること" do
      staff_master = described_class.new(
        code: "STF001",
        name: "オーナー",
        role_code: "owner",
        employment_started_on: nil
      )

      expect(staff_master).to be_invalid
      expect(staff_master.errors[:employment_started_on]).to be_present
    end
  end

  describe "associations" do
    it "staffを1件紐付けられること" do
      staff_master = described_class.create!(
        code: "STF001",
        name: "オーナー",
        role_code: "owner",
        employment_started_on: Date.current
      )

      staff = Staff.create!(
        staff_master: staff_master,
        password: "password",
        password_confirmation: "password"
      )

      expect(staff_master.staff).to eq(staff)
    end
  end

describe "scopes" do
  it "activeはretired_onがnilのスタッフマスタを返すこと" do
    active_staff = described_class.create!(
      code: "STF001",
      name: "在籍スタッフ",
      role_code: "owner",
      employment_started_on: Date.current,
      retired_on: nil
    )

    described_class.create!(
      code: "STF002",
      name: "退職スタッフ",
      role_code: "operator",
      employment_started_on: Date.current,
      retired_on: Date.current
    )

    expect(described_class.active).to include(active_staff)
    expect(described_class.active.count).to eq(1)
  end

  it "retired_onはretired_onが存在するスタッフマスタを返すこと" do
    described_class.create!(
      code: "STF001",
      name: "在籍スタッフ",
      role_code: "owner",
      employment_started_on: Date.current,
      retired_on: nil
    )

    retired_staff = described_class.create!(
      code: "STF002",
      name: "退職スタッフ",
      role_code: "operator",
      employment_started_on: Date.current,
      retired_on: Date.current
    )

    expect(described_class.retired_on).to include(retired_staff)
    expect(described_class.retired_on.count).to eq(1)
  end
end

  describe "#active?" do
    it "retired_onがnilの場合trueを返すこと" do
      staff_master = described_class.new(retired_on: nil)

      expect(staff_master.active?).to eq(true)
    end
  end

  describe "#retired?" do
    it "retired_onが存在する場合trueを返すこと" do
      staff_master = described_class.new(retired_on: Date.current)

      expect(staff_master.retired?).to eq(true)
    end
  end
end