require "rails_helper"

RSpec.describe StaffGuideState do
  include_context "independent integrity connections"
  after { described_class.where(staff_id: @staff_id).delete_all if @staff_id }

  it "別接続から初回保存しても一件だけになり、完了を優先する" do
    staff = tracked(:staff, staff_master: tracked(:staff_master))
    @staff_id = staff.id
    concurrently do |index|
      status = index.zero? ? "completed" : "skipped"
      described_class.record_outcome!(staff: staff, status: status)
    end
    expect(described_class.where(staff: staff).count).to eq(1)
    expect(described_class.find_by!(staff: staff).status).to eq("completed")
  end
end
