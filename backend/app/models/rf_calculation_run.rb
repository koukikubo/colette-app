class RfCalculationRun < ApplicationRecord
  STATUSES = %w[pending processing completed failed].freeze

  belongs_to :rf_rule_set

  belongs_to :previous_run,
             class_name: "RfCalculationRun",
             optional: true,
             inverse_of: :next_runs

  belongs_to :started_by_staff,
             class_name: "Staff",
             optional: true

  has_many :next_runs,
           class_name: "RfCalculationRun",
           foreign_key: :previous_run_id,
           inverse_of: :previous_run,
           dependent: :restrict_with_error

  has_many :customer_rf_rank_results,
           dependent: :restrict_with_error

  has_one :rf_setting,
          foreign_key: :current_calculation_run_id,
          inverse_of: :current_calculation_run,
          dependent: :restrict_with_error

  validates :base_date,
            :aggregation_started_on,
            :frequency_started_on,
            presence: true

  validates :status,
            inclusion: {
              in: STATUSES
            }

  validates :customer_count,
            :excluded_count,
            :unmatched_count,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0
            }

  validate :calculation_period_must_be_valid

  private

  def calculation_period_must_be_valid
    return if base_date.blank?
    return if aggregation_started_on.blank?
    return if frequency_started_on.blank?

    if aggregation_started_on > frequency_started_on
      errors.add(
        :aggregation_started_on,
        "は来店回数集計開始日以前にしてください"
      )
    end

    return if frequency_started_on <= base_date

    errors.add(
      :frequency_started_on,
      "は基準日以前にしてください"
    )
  end
end
