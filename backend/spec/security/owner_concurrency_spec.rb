require "rails_helper"
require "timeout"

RSpec.describe "最後のownerの同時保護", type: :model do
  self.use_transactional_tests = false

  it "二人が同時に降格しても有効ownerを一人残す" do
    masters = 2.times.map { create(:staff_master, role_code: "owner") }
    staffs = masters.map { |master| create(:staff, staff_master: master) }
    ready = Queue.new
    go = Queue.new
    threads = masters.map do |master|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          go.pop
          StaffMaster.find(master.id).update(role_code: "operator")
        end
      end
    end
    Timeout.timeout(10) do
      2.times { ready.pop }
      2.times { go << true }
      expect(threads.map(&:value).count(true)).to eq(1)
    end
    expect(StaffMaster.where(id: masters.map(&:id), role_code: "owner").count).to eq(1)
  ensure
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
    staffs&.each(&:delete)
    masters&.each(&:delete)
  end
end
