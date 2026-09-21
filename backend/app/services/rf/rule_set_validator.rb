module Rf
  class RuleSetValidator
    Result = Struct.new(
      :errors,
      :warnings,
      keyword_init: true
    ) do
      def valid?
        errors.empty?
      end

      def error_codes
        errors.map { |error| error[:code] }
      end
    end

    def self.call(rule_set)
      new(rule_set).call
    end

    def initialize(rule_set)
      @rule_set = rule_set
      @result = Result.new(
        errors: [],
        warnings: []
      )
    end

    def call
      validate_ranges(
        records: rule_set.recency_rules,
        minimum_attribute: :min_days,
        maximum_attribute: :max_days,
        code_prefix: :recency
      )

      validate_ranges(
        records: rule_set.frequency_rules,
        minimum_attribute: :min_visits,
        maximum_attribute: :max_visits,
        code_prefix: :frequency
      )

      validate_mappings
      validate_active_rf_ranks

      result
    end

    private

    attr_reader :rule_set, :result

    def validate_ranges(
      records:,
      minimum_attribute:,
      maximum_attribute:,
      code_prefix:
    )
      ordered_records =
        records.sort_by do |record|
          record.public_send(minimum_attribute)
        end

      if ordered_records.empty?
        add_error(
          :"#{code_prefix}_missing",
          "#{code_prefix}条件が登録されていません"
        )
        return
      end

      first_minimum =
        ordered_records.first.public_send(minimum_attribute)

      if first_minimum != 0
        add_error(
          :"#{code_prefix}_start",
          "#{code_prefix}条件は0から開始してください"
        )
      end

      ordered_records.each_cons(2) do |current, following|
        current_maximum =
          current.public_send(maximum_attribute)

        following_minimum =
          following.public_send(minimum_attribute)

        if current_maximum.nil?
          add_error(
            :"#{code_prefix}_upper_limit",
            "上限なしの#{code_prefix}条件は最後にしてください"
          )
          next
        end

        expected_minimum = current_maximum + 1

        if following_minimum > expected_minimum
          add_error(
            :"#{code_prefix}_gap",
            "#{code_prefix}条件に未定義の範囲があります"
          )
        elsif following_minimum < expected_minimum
          add_error(
            :"#{code_prefix}_overlap",
            "#{code_prefix}条件の範囲が重複しています"
          )
        end
      end

      return if ordered_records.last.public_send(maximum_attribute).nil?

      add_error(
        :"#{code_prefix}_upper_limit",
        "最後の#{code_prefix}条件は上限なしにしてください"
      )
    end

    def validate_mappings
      recency_rules = rule_set.recency_rules.to_a
      frequency_rules = rule_set.frequency_rules.to_a

      expected_pairs =
        recency_rules.product(frequency_rules).map do |recency, frequency|
          [ recency.id, frequency.id ]
        end

      actual_pairs =
        rule_set.rank_mappings.map do |mapping|
          [
            mapping.rf_recency_rule_id,
            mapping.rf_frequency_rule_id
          ]
        end

      missing_pairs = expected_pairs - actual_pairs

      return if missing_pairs.empty?

      add_error(
        :mapping_missing,
        "RFランクが設定されていないR・Fの組み合わせがあります"
      )
    end

    def validate_active_rf_ranks
      has_inactive_rank =
        rule_set
          .rank_mappings
          .includes(rf_rank: :standard_master)
          .any? do |mapping|
            !mapping.rf_rank.active? ||
              !mapping.rf_rank.standard_master.active?
          end

      return unless has_inactive_rank

      add_error(
        :inactive_rf_rank,
        "無効なRFランクが使用されています"
      )
    end

    def add_error(code, message)
      result.errors << {
        code: code,
        message: message
      }
    end
  end
end
