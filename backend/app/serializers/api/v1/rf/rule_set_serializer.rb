class Api::V1::Rf::RuleSetSerializer < ApplicationSerializer
  def as_json
    {
      id: resource.id,
      name: resource.name,
      no_visit_rank_id: resource.no_visit_rank_id,
      version: resource.version,
      aggregation_months: resource.aggregation_months,
      frequency_window_months:
        resource.frequency_window_months,
      status: resource.status,
      published_at: resource.published_at,
      recency_rules: serialize_recency_rules,
      frequency_rules: serialize_frequency_rules,
      rank_mappings: serialize_rank_mappings,
      lock_version: resource.lock_version,
      created_by_staff: serialize_created_by_staff,
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
    resource
      .rank_mappings
      .order(
        :rf_recency_rule_id,
        :rf_frequency_rule_id
      )
      .map do |mapping|
      {
        recency_rule_id: mapping.rf_recency_rule_id,
        frequency_rule_id:
          mapping.rf_frequency_rule_id,
        rf_rank: serialize_mapping_rank(mapping)
      }
    end
  end

  def serialize_mapping_rank(mapping)
    snapshots = resource.rf_rank_snapshots

    if resource.status == "archived" && !snapshots.nil?
      snapshot =
        snapshots.find do |item|
          item.fetch("id") == mapping.rf_rank_id
        end

      if snapshot.nil?
        raise KeyError,
              "アーカイブ済みルールにRFランクID #{mapping.rf_rank_id}の保存情報がありません"
      end

      return {
        id: snapshot.fetch("id"),
        display_code: snapshot.fetch("display_code") { snapshot.fetch("id").to_s.rjust(5, "0") },
        label: snapshot.fetch("label"),
        display_color: snapshot.fetch("display_color")
      }
    end

    rank = mapping.rf_rank

    {
      id: rank.id,
      display_code: rank.display_code,
      label: rank.label,
      display_color: rank.display_color
    }
end
end
