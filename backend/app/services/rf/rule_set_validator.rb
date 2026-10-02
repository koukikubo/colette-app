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
      validate_no_visit_rank

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
          "#{range_title(code_prefix)}を1件以上追加してください"
        )
        return
      end

      first_minimum =
        ordered_records.first.public_send(minimum_attribute)

      if first_minimum != 0
        add_error(
          :"#{code_prefix}_start",
          "最初の#{range_title(code_prefix)}は0#{range_unit(code_prefix)}から開始してください"
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
            "「#{range_label(current)}」は上限なしのため、最後の条件にしてください"
          )
          next
        end

        expected_minimum = current_maximum + 1

        if following_minimum > expected_minimum
          add_error(
            :"#{code_prefix}_gap",
            "「#{range_label(current)}」と「#{range_label(following)}」の間で、" \
              "#{expected_minimum}#{range_unit(code_prefix)}から" \
              "#{following_minimum - 1}#{range_unit(code_prefix)}までが未設定です"
          )
        elsif following_minimum < expected_minimum
          add_error(
            :"#{code_prefix}_overlap",
            "「#{range_label(current)}」と「#{range_label(following)}」で、" \
              "#{following_minimum}#{range_unit(code_prefix)}から" \
              "#{current_maximum}#{range_unit(code_prefix)}までが重複しています"
          )
        end
      end

      return if ordered_records.last.public_send(maximum_attribute).nil?

      add_error(
        :"#{code_prefix}_upper_limit",
        "最後の#{range_title(code_prefix)}は上限なしにしてください"
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

      missing_descriptions =
        missing_pairs.first(5).filter_map do |recency_id, frequency_id|
          recency = recency_rules.find { |rule| rule.id == recency_id }
          frequency = frequency_rules.find { |rule| rule.id == frequency_id }

          next if recency.nil? || frequency.nil?

          "「#{range_label(recency)} × #{range_label(frequency)}」"
        end

      remaining_count = missing_pairs.length - missing_descriptions.length
      suffix = remaining_count.positive? ? "（ほか#{remaining_count}件）" : ""

      add_error(
        :mapping_missing,
        "#{missing_descriptions.join('、')}のRFランクを選択してください#{suffix}"
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

    def validate_no_visit_rank
      no_visit_rank_exists =
        StandardListMaster
          .joins(:standard_master)
          .exists?(
            code: "N",
            active: true,
            standard_masters: {
              system_key: "rf_rank",
              active: true
            }
          )

      return if no_visit_rank_exists

      add_error(
        :no_visit_rank_missing,
        "来店実績がない顧客に使用する有効なNランクが登録されていません"
      )
    end

    def add_error(code, message)
      result.errors << {
        code: code,
        message: message
      }
    end

    def range_title(code_prefix)
      code_prefix == :recency ? "最終来店日からの期間" : "対象期間内の来店回数"
    end

    def range_unit(code_prefix)
      code_prefix == :recency ? "日" : "回"
    end

    def range_label(record)
      record.label.presence || "名称未設定の条件"
    end
  end
end
