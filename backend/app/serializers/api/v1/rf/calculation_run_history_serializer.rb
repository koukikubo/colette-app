class Api::V1::Rf::CalculationRunHistorySerializer <
  ApplicationSerializer
  def initialize(
    resource,
    current_run_id:,
    restorable_run_ids:
  )
    super(resource)

    @current_run_id = current_run_id
    @restorable_run_ids = restorable_run_ids
  end

  def as_json
    {
      id: resource.id,
      previous_run_id: resource.previous_run_id,
      rule_set: serialize_rule_set,
      base_date: resource.base_date,
      aggregation_started_on:
        resource.aggregation_started_on,
      frequency_started_on:
        resource.frequency_started_on,
      status: resource.status,
      customer_count: resource.customer_count,
      excluded_count: resource.excluded_count,
      unmatched_count: resource.unmatched_count,
      started_by_staff:
        serialize_started_by_staff,
      started_at: resource.started_at,
      completed_at: resource.completed_at,
      created_at: resource.created_at,
      current: current?,
      restorable: restorable?
    }
  end

  private

  attr_reader :current_run_id, :restorable_run_ids

  def serialize_rule_set
    {
      id: resource.rf_rule_set.id,
      name: resource.rf_rule_set.name,
      version: resource.rf_rule_set.version
    }
  end

  def serialize_started_by_staff
    staff = resource.started_by_staff
    return nil if staff.nil?

    {
      id: staff.id,
      code: staff.staff_master&.code,
      name: staff.staff_master&.name
    }
  end

  def current?
    resource.id == current_run_id
  end

  def restorable?
    resource.status == "completed" &&
      restorable_run_ids.include?(resource.id)
  end
end
