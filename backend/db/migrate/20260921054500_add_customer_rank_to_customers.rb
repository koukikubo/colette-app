class AddCustomerRankToCustomers < ActiveRecord::Migration[8.1]
  def change
    add_reference :customers,
                  :customer_rank,
                  null: true,
                  foreign_key: {
                    to_table: :standard_list_masters
                  }
  end
end
