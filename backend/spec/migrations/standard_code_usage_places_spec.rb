require "rails_helper"
require Rails.root.join("db/migrate/20261125100000_add_standard_code_usage_places")

RSpec.describe AddStandardCodeUsagePlaces, type: :model do
  it "旧設定を共通設定へ移し、回答・選択肢IDと単複選択を保持する" do
    master = create(:standard_master, system_key: nil, customer_detail_mode: "multiple", customer_detail_group: "嗜好")
    customer = create(:customer)
    choice = create(:standard_list_master, standard_master: master)
    answer = CustomerDetailSelection.create!(customer: customer, standard_list_master: choice)
    disabled = create(:standard_master, system_key: nil, customer_detail_mode: "multiple")
    disabled_choices = 2.times.map { create(:standard_list_master, standard_master: disabled) }
    disabled_choices.each { |item| CustomerDetailSelection.create!(customer: customer, standard_list_master: item) }
    disabled.update!(customer_detail_mode: "none")
    migration = described_class.new
    # 専用test DBのテストトランザクション内で旧スキーマを再現する。
    migration.down
    migration.up
    expect(master.reload).to have_attributes(input_type: "multiple", input_group: "嗜好", customer_detail_mode: "multiple")
    expect(master.usage_place.key).to eq("customer_details")
    expect(disabled.reload).to have_attributes(usage_place_id: nil, input_type: "multiple")
    disabled.update!(usage_place: StandardCodeUsagePlace.find_by!(key: "customer_details"))
    expect(CustomerDetailSelection.where(customer: customer, standard_list_master: disabled_choices).count).to eq(2)
    expect(answer.reload).to have_attributes(customer_id: customer.id, standard_list_master_id: choice.id)
  end
end
