require "rails_helper"

RSpec.describe StandardCodes::ConfigurationLock do
  include_context "independent integrity connections"

  it "上限直前に別接続から追加しても、上限を超えて保存しない" do
    stub_const("StandardMaster::MAX_RECORDS", StandardMaster.count + 1)
    first_position = StandardMaster.maximum(:position).to_i + 1
    results = concurrently do |index|
      master = StandardMaster.new(name: "上限確認#{index}", position: first_position + index, active: true)
      if master.save
        @records << master
        :saved
      else
        expect(master.errors.full_messages.join).to include("99,999件")
        :limited
      end
    end
    expect(results).to contain_exactly(:saved, :limited)
  end
end
