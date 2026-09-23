module Rf
  class RuleSetDeleter
    def self.call(rule_set:, expected_lock_version:)
      new(
        rule_set: rule_set,
        expected_lock_version: expected_lock_version
      ).call
    end

    def initialize(rule_set:, expected_lock_version:)
      @rule_set = rule_set
      @expected_lock_version = expected_lock_version
    end

    def call
      ActiveRecord::Base.transaction do
        rule_set.lock!

        ensure_draft!
        ensure_lock_version!

        rule_set.rank_mappings.destroy_all
        rule_set.recency_rules.destroy_all
        rule_set.frequency_rules.destroy_all
        rule_set.destroy!
      end
    end

    private

    attr_reader :rule_set, :expected_lock_version

    def ensure_draft!
      return if rule_set.status == "draft"

      rule_set.errors.add(
        :status,
        "draftのRFルールのみ削除できます"
      )

      raise ActiveRecord::RecordInvalid.new(rule_set)
    end

    def ensure_lock_version!
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
        "destroy"
      )
    end
  end
end
