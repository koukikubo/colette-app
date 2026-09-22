class Api::V1::Rf::RuleSetSerializer < ApplicationSerializer
  def as_json
    {
      id: resource.id,
      name: resource.name,
      version: resource.version,
      aggregation_months: resource.aggregation_months,
      frequency_window_months:
        resource.frequency_window_months,
      status: resource.status,
      published_at: resource.published_at,
      recency_rules: serialize_recency_rules,
      frequency_rules: serialize_frequency_rules,
      rank_mappings: serialize_rank_mappings
    }
  end

      private

  def serialize_recency_rules
    resource.recency_rules.order(:position).map do |rule|
      {
        id: rule.id,
        code: rule.code,
        label: rule.label,
        min_days: rule.min_days,
        max_days: rule.max_days,
        position: rule.position
      }
    end
  end

  def serialize_frequency_rules
    resource.frequency_rules.order(:position).map do |rule|
      {
        id: rule.id,
        code: rule.code,
        label: rule.label,
        min_visits: rule.min_visits,
        max_visits: rule.max_visits,
        position: rule.position
      }
    end
  end

  def serialize_rank_mappings
    resource.rank_mappings.map do |mapping|
      {
        recency_rule_id: mapping.rf_recency_rule_id,
        frequency_rule_id:
          mapping.rf_frequency_rule_id,
        rf_rank: {
          id: mapping.rf_rank.id,
          code: mapping.rf_rank.code,
          label: mapping.rf_rank.label
        }
      }
    end
  end
end
