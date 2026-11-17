class Api::V1::Rf::RuleSetSummarySerializer <
  ApplicationSerializer
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
      created_by_staff:
        serialize_created_by_staff,
      created_at: resource.created_at,
      updated_at: resource.updated_at
    }
  end

  private

  def serialize_created_by_staff
    staff = resource.created_by_staff
    return nil if staff.nil?

    {
      id: staff.id,
      code: staff.staff_master&.code,
      name: staff.staff_master&.name
    }
  end
end
