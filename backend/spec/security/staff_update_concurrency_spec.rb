require "rails_helper"

RSpec.describe "staff_update_concurrency", type: :model do
  include_context "independent integrity connections"

  it "同じ版からの担当者変更は片方だけ成功する" do
    master = tracked(:staff_master, role_code: "operator")
    results = concurrently do |index|
      begin
        StaffMaster.find(master.id).update!(name: "更新#{index}", lock_version: master.lock_version)
        :success
      rescue ActiveRecord::StaleObjectError
        :rejected
      end
    end
    expect(results.sort).to eq([ :rejected, :success ])
  end
end
