module Rf
  class RuleSetUpdater
    def self.call(rule_set:, attributes:)
      new(
        rule_set: rule_set,
        attributes: attributes
      ).call
    end

    def initialize(rule_set:, attributes:)
      @rule_set = rule_set
      @attributes = attributes.deep_symbolize_keys
    end

    def call
      ActiveRecord::Base.transaction do
        rule_set.lock!

        ensure_draft!
        ensure_lock_version!

        update_rule_set!
        remove_current_structure!

        recency_rules = create_recency_rules!
        frequency_rules = create_frequency_rules!

        create_rank_mappings!(
          recency_rules,
          frequency_rules
        )

        rule_set.reload
      end
    end

    private

    attr_reader :rule_set, :attributes

    def ensure_draft!
      return if rule_set.status == "draft"

      rule_set.errors.add(
        :status,
        "draftのRFルールのみ更新できます"
      )

      raise ActiveRecord::RecordInvalid.new(rule_set)
    end

    def ensure_lock_version!
      expected_lock_version = attributes[:lock_version]

      if expected_lock_version.blank?
        rule_set.errors.add(
          :lock_version,
          "を指定してください"
        )

        raise ActiveRecord::RecordInvalid.new(rule_set)
      end

      return if expected_lock_version.to_i == rule_set.lock_version

      raise ActiveRecord::StaleObjectError.new(
        rule_set,
        "update"
      )
    end

    def update_rule_set!
      rule_set.update!(
        name: attributes[:name],
        aggregation_months:
          attributes[:aggregation_months],
        frequency_window_months:
          attributes[:frequency_window_months]
      )
    end

    def remove_current_structure!
      rule_set.rank_mappings.destroy_all
      rule_set.recency_rules.destroy_all
      rule_set.frequency_rules.destroy_all
    end

    def create_recency_rules!
      attributes
        .fetch(:recency_rules, [])
        .each_with_object({}) do |rule_attributes, rules|
        rule =
          rule_set.recency_rules.create!(
            rule_attributes.slice(
              :code,
              :label,
              :min_days,
              :max_days,
              :position
            )
          )

        rules[rule.code] = rule
      end
    end

    def create_frequency_rules!
      attributes
        .fetch(:frequency_rules, [])
        .each_with_object({}) do |rule_attributes, rules|
        rule =
          rule_set.frequency_rules.create!(
            rule_attributes.slice(
              :code,
              :label,
              :min_visits,
              :max_visits,
              :position
            )
          )

        rules[rule.code] = rule
      end
    end

    def create_rank_mappings!(
      recency_rules,
      frequency_rules
    )
      attributes
        .fetch(:rank_mappings, [])
        .each do |mapping_attributes|
        recency_rule =
          find_rule!(
            recency_rules,
            mapping_attributes[:recency_code],
            "R条件"
          )

        frequency_rule =
          find_rule!(
            frequency_rules,
            mapping_attributes[:frequency_code],
            "F条件"
          )

        rule_set.rank_mappings.create!(
          rf_recency_rule: recency_rule,
          rf_frequency_rule: frequency_rule,
          rf_rank_id: mapping_attributes[:rf_rank_id]
        )
      end
    end

    def find_rule!(rules, code, label)
      rule = rules[code]
      return rule if rule.present?

      rule_set.errors.add(
        :rank_mappings,
        "#{label}「#{code}」が存在しません"
      )

      raise ActiveRecord::RecordInvalid.new(rule_set)
    end
  end
end
