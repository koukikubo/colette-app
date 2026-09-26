module Rf
  class CustomerRankCalculator
    Result = Struct.new(
      :rf_rank,
      :recency_days,
      :frequency_count,
      :last_visit_on,
      keyword_init: true
    )

    def self.call(customer:, rule_set:, base_date:)
      new(
        customer: customer,
        rule_set: rule_set,
        base_date: base_date
      ).call
    end

    def initialize(customer:, rule_set:, base_date:)
      @customer = customer
      @rule_set = rule_set
      @base_date = base_date.to_date
    end

    def call
      last_visit_at = completed_visits.maximum(:starts_at)

      return result_without_visit if last_visit_at.nil?

      recency_days =
        (base_date - last_visit_at.in_time_zone.to_date).to_i

      frequency_count =
        completed_visits
          .where(starts_at: frequency_period)
          .count

      recency_rule = find_recency_rule(recency_days)
      frequency_rule = find_frequency_rule(frequency_count)

      mapping =
        rule_set.rank_mappings.find_by!(
          rf_recency_rule: recency_rule,
          rf_frequency_rule: frequency_rule
        )

      Result.new(
        rf_rank: mapping.rf_rank,
        recency_days: recency_days,
        frequency_count: frequency_count,
        last_visit_on: last_visit_at.in_time_zone.to_date
      )
    end

    private

    attr_reader :customer, :rule_set, :base_date

    def completed_visits
      @completed_visits ||=
        customer
          .reservations
          .where.not(completed_at: nil)
          .where(canceled_at: nil)
          .where(starts_at: aggregation_period)
    end

    def aggregation_period
      aggregation_started_on.beginning_of_day...
        base_date.next_day.beginning_of_day
    end

    def frequency_period
      frequency_started_on.beginning_of_day...
        base_date.next_day.beginning_of_day
    end

    def aggregation_started_on
      base_date.advance(
        months: -rule_set.aggregation_months
      )
    end

    def frequency_started_on
      base_date.advance(
        months: -rule_set.frequency_window_months
      )
    end

    def find_recency_rule(recency_days)
      rule_set.recency_rules.detect do |rule|
        value_in_range?(
          recency_days,
          minimum: rule.min_days,
          maximum: rule.max_days
        )
      end || raise(
        ActiveRecord::RecordNotFound,
        "該当するR条件がありません"
      )
    end

    def find_frequency_rule(frequency_count)
      rule_set.frequency_rules.detect do |rule|
        value_in_range?(
          frequency_count,
          minimum: rule.min_visits,
          maximum: rule.max_visits
        )
      end || raise(
        ActiveRecord::RecordNotFound,
        "該当するF条件がありません"
      )
    end

    def value_in_range?(value, minimum:, maximum:)
      value >= minimum &&
        (maximum.nil? || value <= maximum)
    end

    def result_without_visit
      Result.new(
        rf_rank: no_visit_rank,
        recency_days: nil,
        frequency_count: 0,
        last_visit_on: nil
      )
    end

    def no_visit_rank
      StandardListMaster
        .joins(:standard_master)
        .find_by!(
          code: "N",
          active: true,
          standard_masters: {
            system_key: "rf_rank",
            active: true
          }
        )
    end
  end
end
