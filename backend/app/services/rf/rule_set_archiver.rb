module Rf
  class RuleSetArchiver
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

        ensure_published!
        ensure_lock_version!

        rule_set.update!(
          status: "archived"
        )

        rule_set.reload
      end
    end

    private

    attr_reader :rule_set, :expected_lock_version

    def ensure_published!
      return if rule_set.status == "published"

      rule_set.errors.add(
        :status,
        "公開中のRFルールのみアーカイブできます"
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
        "archive"
      )
    end
  end
end
