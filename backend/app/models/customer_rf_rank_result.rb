class CustomerRfRankResult < ApplicationRecord
  EXCLUSION_REASONS = %w[
    manual_customer_rank
    no_matching_rule
  ].freeze

  belongs_to :rf_calculation_run
  belongs_to :customer

  belongs_to :rf_rank,
             class_name: "StandardListMaster",
             optional: true

  validates :customer_id,
            uniqueness: {
              scope: :rf_calculation_run_id
            }

  validates :recency_days,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0
            },
            allow_nil: true

  validates :frequency_count,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0
            }

  validates :exclusion_reason,
            inclusion: {
              in: EXCLUSION_REASONS
            },
            allow_nil: true

  validates :rf_rank,
            standard_list_category: {
              system_key: "rf_rank"
            }

  validate :rank_or_exclusion_reason_must_be_present
  validate :rank_and_exclusion_reason_cannot_both_be_present

  private

  def rank_or_exclusion_reason_must_be_present
    return if rf_rank.present? || exclusion_reason.present?

    errors.add(
      :base,
      "RFランクまたは集計対象外理由を指定してください"
    )
  end

  def rank_and_exclusion_reason_cannot_both_be_present
    return if rf_rank.blank? || exclusion_reason.blank?

    errors.add(
      :base,
      "RFランクと集計対象外理由は同時に指定できません"
    )
  end
end
