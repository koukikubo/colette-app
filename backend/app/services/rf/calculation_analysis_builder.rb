module Rf
  class CalculationAnalysisBuilder
    class IncompleteRunError < StandardError; end

    Result = Struct.new(
      :calculation_run,
      :eligible_count,
      :no_visit_count,
      :no_visit_percentage,
      :unmatched_percentage,
      :recency_rules,
      :frequency_rules,
      :rank_distribution,
      :cells,
      :comparison_run,
      :rank_comparisons,
      keyword_init: true
    )

    Cell = Struct.new(
      :recency_rule,
      :frequency_rule,
      :rf_rank,
      :count,
      :percentage,
      keyword_init: true
    )

    RankDistribution = Struct.new(
      :rf_rank,
      :count,
      :percentage,
      keyword_init: true
    )

    RankComparison = Struct.new(
      :rf_rank,
      :current_count,
      :previous_count,
      :count_delta,
      :current_percentage,
      :previous_percentage,
      :percentage_point_delta,
      keyword_init: true
    )

    def self.call(calculation_run:)
      new(calculation_run: calculation_run).call
    end

    def initialize(calculation_run:)
      @calculation_run = calculation_run
    end

    def call
      validate_calculation_run!

      Result.new(
        calculation_run: calculation_run,
        eligible_count: eligible_count(calculation_run),
        no_visit_count: no_visit_count,
        no_visit_percentage:
          percentage(
            no_visit_count,
            eligible_count(calculation_run)
          ),
        unmatched_percentage:
          percentage(
            calculation_run.unmatched_count,
            eligible_count(calculation_run)
          ),
        recency_rules: recency_rules,
        frequency_rules: frequency_rules,
        rank_distribution: build_rank_distribution,
        cells: build_cells,
        comparison_run: comparison_run,
        rank_comparisons: build_rank_comparisons
      )
    end

    private

    attr_reader :calculation_run

    def validate_calculation_run!
      return if calculation_run.status == "completed"

      raise IncompleteRunError,
            "完了していないRF計算結果は分析できません"
    end

    def rule_set
      @rule_set ||= calculation_run.rf_rule_set
    end

    def recency_rules
      @recency_rules ||=
        rule_set
          .recency_rules
          .order(:position, :id)
          .to_a
    end

    def frequency_rules
      @frequency_rules ||=
        rule_set
          .frequency_rules
          .order(:position, :id)
          .to_a
    end

    def rank_mappings
      @rank_mappings ||=
        rule_set
          .rank_mappings
          .includes(:rf_rank)
          .to_a
    end

    def mapping_by_dimensions
      @mapping_by_dimensions ||=
        rank_mappings.index_by do |mapping|
          [
            mapping.rf_recency_rule_id,
            mapping.rf_frequency_rule_id
          ]
        end
    end

    def calculated_results
      @calculated_results ||=
        calculation_run
          .customer_rf_rank_results
          .where(exclusion_reason: nil)
          .to_a
    end

    def results_with_visit
      @results_with_visit ||=
        calculated_results.select do |result|
          result.recency_days.present?
        end
    end

    def eligible_count(run)
      [
        run.customer_count - run.excluded_count,
        0
      ].max
    end

    def no_visit_count
      @no_visit_count ||=
        calculated_results.count do |result|
          result.recency_days.nil?
        end
    end

    def build_rank_distribution
      counts = rank_counts_for(calculation_run)
      total = eligible_count(calculation_run)

      rf_ranks.map do |rank|
        count = counts.fetch(rank.id, 0)

        RankDistribution.new(
          rf_rank: rank,
          count: count,
          percentage: percentage(count, total)
        )
      end
    end

    def rf_ranks
      @rf_ranks ||=
        StandardListMaster
          .joins(:standard_master)
          .where(
            standard_list_masters: {
              active: true
            },
            standard_masters: {
              system_key: "rf_rank",
              active: true
            }
          )
          .order(:position, :id)
          .to_a
    end

    def build_cells
      counts = cell_counts
      total = eligible_count(calculation_run)

      recency_rules.flat_map do |recency_rule|
        frequency_rules.map do |frequency_rule|
          key = [
            recency_rule.id,
            frequency_rule.id
          ]

          mapping = mapping_by_dimensions.fetch(key)
          count = counts.fetch(key, 0)

          Cell.new(
            recency_rule: recency_rule,
            frequency_rule: frequency_rule,
            rf_rank: mapping.rf_rank,
            count: count,
            percentage: percentage(count, total)
          )
        end
      end
    end

    def cell_counts
      counts = Hash.new(0)

      results_with_visit.each do |result|
        next if result.rf_rank_id.nil?

        recency_rule =
          find_recency_rule(result.recency_days)

        frequency_rule =
          find_frequency_rule(result.frequency_count)

        next if recency_rule.nil?
        next if frequency_rule.nil?

        counts[
          [
            recency_rule.id,
            frequency_rule.id
          ]
        ] += 1
      end

      counts
    end

    def find_recency_rule(recency_days)
      recency_rules.find do |rule|
        value_in_range?(
          recency_days,
          minimum: rule.min_days,
          maximum: rule.max_days
        )
      end
    end

    def find_frequency_rule(frequency_count)
      frequency_rules.find do |rule|
        value_in_range?(
          frequency_count,
          minimum: rule.min_visits,
          maximum: rule.max_visits
        )
      end
    end

    def value_in_range?(value, minimum:, maximum:)
      value >= minimum &&
        (maximum.nil? || value <= maximum)
    end

    def comparison_run
      return @comparison_run if defined?(@comparison_run)

      target_date = calculation_run.base_date.prev_year
      run = calculation_run.previous_run
      candidates = []

      while run
        if run.status == "completed" &&
            run.base_date <= target_date
          candidates << run
        end

        run = run.previous_run
      end

      @comparison_run =
        candidates.max_by do |candidate|
          [
            candidate.base_date,
            candidate.id
          ]
        end
    end

    def build_rank_comparisons
      previous_run = comparison_run
      return [] if previous_run.nil?

      current_counts = rank_counts_for(calculation_run)
      previous_counts = rank_counts_for(previous_run)

      rank_ids =
        (
          current_counts.keys +
          previous_counts.keys
        ).uniq

      current_total = eligible_count(calculation_run)
      previous_total = eligible_count(previous_run)

      StandardListMaster
        .where(id: rank_ids)
        .order(:position, :id)
        .map do |rank|
          build_rank_comparison(
            rank,
            current_counts,
            previous_counts,
            current_total,
            previous_total
          )
        end
    end

    def build_rank_comparison(
      rank,
      current_counts,
      previous_counts,
      current_total,
      previous_total
    )
      current_count =
        current_counts.fetch(rank.id, 0)

      previous_count =
        previous_counts.fetch(rank.id, 0)

      current_percentage =
        percentage(current_count, current_total)

      previous_percentage =
        percentage(previous_count, previous_total)

      RankComparison.new(
        rf_rank: rank,
        current_count: current_count,
        previous_count: previous_count,
        count_delta:
          current_count - previous_count,
        current_percentage: current_percentage,
        previous_percentage: previous_percentage,
        percentage_point_delta:
          (
            current_percentage -
            previous_percentage
          ).round(2)
      )
    end

    def rank_counts_for(run)
      run
        .customer_rf_rank_results
        .where(exclusion_reason: nil)
        .where.not(rf_rank_id: nil)
        .group(:rf_rank_id)
        .count
    end

    def percentage(count, total)
      return 0.0 if total.zero?

      (
        count.to_f /
        total *
        100
      ).round(2)
    end
  end
end
