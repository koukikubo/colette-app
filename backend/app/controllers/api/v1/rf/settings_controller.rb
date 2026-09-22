class Api::V1::Rf::SettingsController < Api::V1::BaseController
  def show
    render_success(
      data: {
        published_rule_set:
          serialize_rule_set(published_rule_set),
        current_calculation_run:
          serialize_calculation_run(
            current_calculation_run
          )
      }
    )
  end

  private

  def published_rule_set
    @published_rule_set ||=
      RfRuleSet
        .includes(
          :recency_rules,
          :frequency_rules,
          rank_mappings: :rf_rank
        )
        .where(status: "published")
        .order(version: :desc)
        .first
  end

  def current_calculation_run
    @current_calculation_run ||=
      RfSetting
        .includes(
          current_calculation_run: {
            started_by_staff: :staff_master
          }
        )
        .first
        &.current_calculation_run
  end

  def serialize_rule_set(rule_set)
    return nil if rule_set.nil?

    Api::V1::Rf::RuleSetSerializer
      .new(rule_set)
      .as_json
  end

  def serialize_calculation_run(calculation_run)
    return nil if calculation_run.nil?

    Api::V1::Rf::CalculationRunSerializer
      .new(calculation_run)
      .as_json
  end
end
