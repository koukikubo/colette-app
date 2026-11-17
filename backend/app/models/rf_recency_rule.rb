class RfRecencyRule < ApplicationRecord
  belongs_to :rf_rule_set

  has_many :rank_mappings,
           class_name: "RfRankMapping",
           dependent: :restrict_with_error

  validates :code, :label, presence: true

  validates :code,
            uniqueness: {
              scope: :rf_rule_set_id
            }

  validates :position,
            uniqueness: {
              scope: :rf_rule_set_id
            },
            numericality: {
              only_integer: true,
              greater_than: 0
            }

  validates :min_days,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0
            }

  validates :max_days,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: :min_days
            },
            allow_nil: true
end
