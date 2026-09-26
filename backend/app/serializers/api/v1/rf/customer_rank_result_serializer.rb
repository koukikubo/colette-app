class Api::V1::Rf::CustomerRankResultSerializer <
  ApplicationSerializer
  def initialize(resource, previous_result:)
    super(resource)

    @previous_result = previous_result
  end

  def as_json
    {
      id: resource.id,
      customer: serialize_customer,
      previous_rf_rank:
        serialize_rf_rank(previous_result&.rf_rank),
      rf_rank: serialize_rf_rank(resource.rf_rank),
      changed: changed?,
      recency_days: resource.recency_days,
      frequency_count: resource.frequency_count,
      last_visit_on: resource.last_visit_on,
      previous_exclusion_reason:
        previous_result&.exclusion_reason,
      exclusion_reason: resource.exclusion_reason
    }
  end

  private

  attr_reader :previous_result

  def serialize_customer
    {
      id: resource.customer.id,
      name: resource.customer.name
    }
  end

  def serialize_rf_rank(rf_rank)
    return nil if rf_rank.nil?

    {
      id: rf_rank.id,
      code: rf_rank.code,
      label: rf_rank.label
    }
  end

  def changed?
    return true if previous_result.nil?

    previous_result.rf_rank_id != resource.rf_rank_id ||
      previous_result.exclusion_reason !=
        resource.exclusion_reason
  end
end
