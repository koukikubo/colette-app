require "rails_helper"

RSpec.describe Customers::DetailFields do
  include_context "independent integrity connections"

  after { CustomerDetailSelection.where(customer_id: @customer_id).delete_all if @customer_id }

  it "独立した接続から同じ版を更新した場合は一方だけを保存する" do
    staff = tracked(:staff, staff_master: tracked(:staff_master))
    customer = tracked(:customer, created_by_staff: staff, updated_by_staff: staff)
    @customer_id = customer.id
    field = tracked(:standard_master, system_key: nil, customer_detail_mode: "single")
    choices = 2.times.map { tracked(:standard_list_master, standard_master: field) }
    results = concurrently do |index|
      described_class.new(Customer.find(customer.id)).update!(
        answers: [ { field_id: field.id, option_ids: [ choices[index].id ] } ],
        lock_version: customer.lock_version, staff: staff
      )
      :saved
    rescue ActiveRecord::StaleObjectError
      :conflict
    end
    expect(results).to contain_exactly(:saved, :conflict)
    expect(CustomerDetailSelection.where(customer: customer).count).to eq(1)
  end
end
