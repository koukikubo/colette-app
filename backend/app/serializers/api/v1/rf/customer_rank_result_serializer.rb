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
        serialize_rf_rank(previous_result),
      rf_rank: serialize_rf_rank(resource),
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

  def serialize_rf_rank(result)
    rank = result&.rf_rank
    return nil if rank.nil?

    snapshots = result.rf_calculation_run.rf_rank_snapshots

    # スナップショット未保存の旧履歴
    if snapshots.nil?
      return {
        id: rank.id,
        display_code: rank.display_code,
        label: rank.label,
        display_color: rank.display_color
      }
    end

    snapshot = snapshots.find do |item|
      item.fetch("id") == result.rf_rank_id
    end

    if snapshot.nil?
      raise KeyError,
            "計算履歴にRFランクID #{result.rf_rank_id}の保存情報がありません"
    end

    {
      id: snapshot.fetch("id"),
      display_code:
        snapshot.fetch("display_code") do
          snapshot.fetch("id").to_s.rjust(5, "0")
        end,
      label: snapshot.fetch("label"),
      display_color: snapshot.fetch("display_color")
    }
  end

  def changed?
    return true if previous_result.nil?

    previous_result.rf_rank_id != resource.rf_rank_id ||
      previous_result.exclusion_reason !=
        resource.exclusion_reason
  end
end
