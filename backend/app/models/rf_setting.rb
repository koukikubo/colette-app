class RfSetting < ApplicationRecord
  belongs_to :current_calculation_run,
             class_name: "RfCalculationRun",
             optional: true,
             inverse_of: :rf_setting

  validates :singleton_key,
            inclusion: {
              in: [ true ]
            },
            uniqueness: true

  validate :current_run_must_be_completed

  private

  def current_run_must_be_completed
    return if current_calculation_run.blank?
    return if current_calculation_run.status == "completed"

    errors.add(
      :current_calculation_run,
      "には計算完了済みの履歴を指定してください"
    )
  end
end
