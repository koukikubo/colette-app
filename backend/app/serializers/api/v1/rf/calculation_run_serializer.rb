class Api::V1::Rf::CalculationRunSerializer < ApplicationSerializer
  def as_json
    {
      id: resource.id,
      rf_rule_set_id: resource.rf_rule_set_id,
      previous_run_id: resource.previous_run_id,
      base_date: resource.base_date,
      aggregation_started_on:
        resource.aggregation_started_on,
      frequency_started_on:
        resource.frequency_started_on,
      status: resource.status,
      customer_count: resource.customer_count,
      excluded_count: resource.excluded_count,
      rank_counts: serialize_rank_counts,
      unmatched_count: resource.unmatched_count,
      started_at: resource.started_at,
      completed_at: resource.completed_at,
      failure_message: resource.failure_message,
      started_by_staff:
        serialize_staff(resource.started_by_staff),
      created_at: resource.created_at
    }
  end

      private

  def serialize_staff(staff)
    return nil if staff.nil?

    {
      id: staff.id,
      code: staff.staff_master&.code,
      name: staff.staff_master&.name
    }
  end

  def serialize_rank_counts
    counts =
      resource
        .customer_rf_rank_results
        .where.not(rf_rank_id: nil)
        .group(:rf_rank_id)
        .count

    StandardListMaster
      .where(id: counts.keys)
      .order(:position, :id)
      .map do |rank|
      {
        id: rank.id,
        code: rank.code,
        label: rank.label,
        count: counts.fetch(rank.id)
      }
    end
  end
end
