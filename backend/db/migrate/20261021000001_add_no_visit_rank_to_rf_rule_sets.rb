class AddNoVisitRankToRfRuleSets < ActiveRecord::Migration[8.1]
  def change
    add_reference :rf_rule_sets,
                  :no_visit_rank,
                  null: true,
                  foreign_key: { to_table: :standard_list_masters }
  end
end
