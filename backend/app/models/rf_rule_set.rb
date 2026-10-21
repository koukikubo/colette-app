class RfRuleSet < ApplicationRecord
  STATUSES = %w[draft published archived].freeze

  belongs_to :created_by_staff,
             class_name: "Staff",
             optional: true

  has_many :recency_rules,
           class_name: "RfRecencyRule",
           dependent: :restrict_with_error

  has_many :frequency_rules,
           class_name: "RfFrequencyRule",
           dependent: :restrict_with_error

  has_many :rank_mappings,
           class_name: "RfRankMapping",
           dependent: :restrict_with_error

  has_many :calculation_runs,
          class_name: "RfCalculationRun",
          dependent: :restrict_with_error

  validates :name, presence: true

  validates :version,
            presence: true,
            uniqueness: true,
            numericality: {
              only_integer: true,
              greater_than: 0
            }

  validates :aggregation_months,
            numericality: {
              only_integer: true,
              greater_than: 0
            }

  validates :frequency_window_months,
            numericality: {
              only_integer: true,
              greater_than: 0
            }

  validates :status,
            inclusion: {
              in: STATUSES
            }

  validate :frequency_window_must_fit_within_aggregation

  def build_rf_rank_snapshots
    rank_ids = rank_mappings.select(:rf_rank_id)

    StandardListMaster
      .where(id: rank_ids)
      .ordered
      .map do |rank|
        {
          "id" => rank.id,
          "code" => rank.code,
          "label" => rank.label,
          "display_color" => rank.display_color,
          "position" => rank.position
        }
      end
  end
  private

  def frequency_window_must_fit_within_aggregation
    return if aggregation_months.blank?
    return if frequency_window_months.blank?
    return if frequency_window_months <= aggregation_months

    errors.add(
      :frequency_window_months,
      "は全体集計期間以下にしてください"
    )
  end
end
