module Rf
  class RuleSetPublisher
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
        # 同時に複数のルールが公開されることを防ぐ。
        RfRuleSet.lock.order(:id).load
        rule_set.reload

        ensure_draft!
        ensure_lock_version!
        ensure_valid!

        archive_published_rule_sets!

        rule_set.update!(
          status: "published",
          published_at: Time.current
        )

        rule_set.reload
      end
    end

    private

    attr_reader :rule_set, :expected_lock_version

    def ensure_draft!
      return if rule_set.status == "draft"

      rule_set.errors.add(
        :status,
        "draftのRFルールのみ公開できます"
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
        "publish"
      )
    end

    def ensure_valid!
      result = Rf::RuleSetValidator.call(rule_set)
      return if result.valid?

      result.errors.each do |error|
        rule_set.errors.add(
          :base,
          error[:message]
        )
      end

      raise ActiveRecord::RecordInvalid.new(rule_set)
    end

    def archive_published_rule_sets!
      RfRuleSet
        .where(status: "published")
        .where.not(id: rule_set.id)
        .find_each do |published_rule_set|
        published_rule_set.update!(
          status: "archived"
        )
      end
    end
  end
end
