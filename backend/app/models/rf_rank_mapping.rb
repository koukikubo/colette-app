class RfRankMapping < ApplicationRecord
  belongs_to :rf_rule_set
  belongs_to :rf_recency_rule
  belongs_to :rf_frequency_rule

  belongs_to :rf_rank,
             class_name: "StandardListMaster"

  validates :rf_rank,
            standard_list_category: {
              system_key: "rf_rank"
            }

  validate :dimensions_must_belong_to_rule_set

  private

  def dimensions_must_belong_to_rule_set
    if rf_recency_rule.present? &&
        rf_recency_rule.rf_rule_set_id != rf_rule_set_id
      errors.add(
        :rf_recency_rule,
        "は同じRFルールセットから選択してください"
      )
    end

    if rf_frequency_rule.present? &&
        rf_frequency_rule.rf_rule_set_id != rf_rule_set_id
      errors.add(
        :rf_frequency_rule,
        "は同じRFルールセットから選択してください"
      )
    end
  end
end
