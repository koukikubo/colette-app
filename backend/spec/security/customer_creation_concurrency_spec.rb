require "rails_helper"

RSpec.describe "顧客登録の再送並行性", type: :model do
  include_context "independent integrity connections"
  before do
    @staff = tracked(:staff, staff_master: tracked(:staff_master))
    @key = SecureRandom.hex(16)
  end
  after do
    rows = CustomerCreationRequest.where(key_digest: CreationRequestKey.digest(@key))
    ids = rows.pluck(:customer_id)
    rows.delete_all
    Customer.where(id: ids).delete_all
  end
  it "独立した接続から同時再送しても顧客と履歴を一つだけ保存する" do
    ids = concurrently do
      Customers::IdempotentCreator.call(attributes: { name: @marker, kana: "ドウジ", customer_kind: "individual" }, current_staff: @staff, key: @key).id
    end
    expect(ids.uniq.size).to eq(1)
    expect(Customer.where(id: ids).count).to eq(1)
    expect(CustomerCreationRequest.where(key_digest: CreationRequestKey.digest(@key)).count).to eq(1)
  end
end
