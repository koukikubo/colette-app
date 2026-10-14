class Api::V1::Rf::CalculationAnalysisSerializer <
  ApplicationSerializer
  def as_json
    {
      calculation_run:
        serialize_calculation_run(
          resource.calculation_run
        ),
      eligible_count: resource.eligible_count,
      excluded_count:
        resource.calculation_run.excluded_count,
      unmatched_count:
        resource.calculation_run.unmatched_count,
      unmatched_percentage:
        resource.unmatched_percentage,
      no_visit: {
        count: resource.no_visit_count,
        percentage:
          resource.no_visit_percentage
      },
      recency_rules:
        resource.recency_rules.map do |rule|
          serialize_recency_rule(rule)
        end,
      frequency_rules:
        resource.frequency_rules.map do |rule|
          serialize_frequency_rule(rule)
        end,
      rank_distribution:
        resource.rank_distribution.map do |distribution|
          serialize_rank_distribution(distribution)
        end,
      cells:
        resource.cells.map do |cell|
          serialize_cell(cell)
        end,
      comparison: serialize_comparison
    }
  end

  private

  def serialize_calculation_run(run)
    {
      id: run.id,
      base_date: run.base_date,
      rf_rule_set_id: run.rf_rule_set_id,
      rule_set: {
        id: run.rf_rule_set.id,
        name: run.rf_rule_set.name,
        version: run.rf_rule_set.version
      }
    }
  end

  def serialize_recency_rule(rule)
    {
      id: rule.id,
      code: rule.code,
      label: rule.label,
      min_days: rule.min_days,
      max_days: rule.max_days,
      position: rule.position
    }
  end

  def serialize_frequency_rule(rule)
    {
      id: rule.id,
      code: rule.code,
      label: rule.label,
      min_visits: rule.min_visits,
      max_visits: rule.max_visits,
      position: rule.position
    }
  end

  def serialize_cell(cell)
    {
      recency_rule_id: cell.recency_rule.id,
      frequency_rule_id:
        cell.frequency_rule.id,
      rf_rank: serialize_rf_rank(cell.rf_rank),
      count: cell.count,
      percentage: cell.percentage
    }
  end

  def serialize_comparison
    return nil if resource.comparison_run.nil?

    {
      calculation_run_id:
        resource.comparison_run.id,
      base_date:
        resource.comparison_run.base_date,
      ranks:
        resource.rank_comparisons.map do |comparison|
          serialize_rank_comparison(comparison)
        end
    }
  end

  def serialize_rank_comparison(comparison)
    {
      rf_rank:
        serialize_rf_rank(comparison.rf_rank),
      current_count: comparison.current_count,
      previous_count: comparison.previous_count,
      count_delta: comparison.count_delta,
      current_percentage:
        comparison.current_percentage,
      previous_percentage:
        comparison.previous_percentage,
      percentage_point_delta:
        comparison.percentage_point_delta
    }
  end

  def serialize_rf_rank(rank)
    {
      id: rank.id,
      code: rank.code,
      label: rank.label,
      display_color: rank.display_color
    }
  end

  def serialize_rank_distribution(distribution)
    {
      rf_rank:
        serialize_rf_rank(distribution.rf_rank),
      count: distribution.count,
      percentage: distribution.percentage
    }
  end
end
