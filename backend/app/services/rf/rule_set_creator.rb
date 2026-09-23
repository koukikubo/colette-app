module Rf
  class RuleSetCreator
    def self.call(attributes:, created_by_staff:)
      new(
        attributes: attributes,
        created_by_staff: created_by_staff
      ).call
    end

    def initialize(attributes:, created_by_staff:)
      @attributes = attributes.deep_symbolize_keys
      @created_by_staff = created_by_staff
    end

    def call
      ActiveRecord::Base.transaction do
        rule_set = create_rule_set!

        recency_rules =
          create_recency_rules!(rule_set)

        frequency_rules =
          create_frequency_rules!(rule_set)

        create_rank_mappings!(
          rule_set,
          recency_rules,
          frequency_rules
        )

        rule_set
      end
    end

    private

    attr_reader :attributes, :created_by_staff

    def create_rule_set!
      RfRuleSet.create!(
        name: attributes[:name],
        version: next_version,
        aggregation_months:
          attributes[:aggregation_months],
        frequency_window_months:
          attributes[:frequency_window_months],
        status: "draft",
        created_by_staff: created_by_staff
      )
    end

    def create_recency_rules!(rule_set)
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

    def create_frequency_rules!(rule_set)
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
      rule_set,
      recency_rules,
      frequency_rules
    )
      attributes
        .fetch(:rank_mappings, [])
        .each do |mapping_attributes|
        recency_rule =
          find_dimension_rule!(
            rule_set,
            recency_rules,
            mapping_attributes[:recency_code],
            "R条件"
          )

        frequency_rule =
          find_dimension_rule!(
            rule_set,
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

    def find_dimension_rule!(
      rule_set,
      rules,
      code,
      label
    )
      rule = rules[code]
      return rule if rule.present?

      rule_set.errors.add(
        :rank_mappings,
        "#{label}「#{code}」が存在しません"
      )

      raise ActiveRecord::RecordInvalid.new(rule_set)
    end

    def next_version
      RfRuleSet.maximum(:version).to_i + 1
    end
  end
end
