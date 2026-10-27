module Rf
  class CustomerMovementSummary
    CATEGORIES = %i[
      added
      removed
      excluded
      unmatched
      no_visit
      up
      down
      unchanged
      same_position
    ].freeze

    def self.call(calculation_run:)
      new(calculation_run: calculation_run).call
    end

    def initialize(calculation_run:)
      @calculation_run = calculation_run
    end

    def call
      unless calculation_run.status == "completed"
        raise RunPopulationSummary::IncompleteRunError,
              "完了していないRF計算結果は比較できません"
      end

      previous_run = calculation_run.previous_run

      unless previous_run
        return {
          comparison_run_id: nil,
          counts: nil,
          transitions: []
        }
      end

      previous_ranks = ranks_for(previous_run)
      current_ranks = ranks_for(calculation_run)

      previous_results = results_for(previous_run)
      current_results = results_for(calculation_run)

      previous_no_visit_id =
        previous_run.rf_rule_set.no_visit_rank_id

      current_no_visit_id =
        calculation_run.rf_rule_set.no_visit_rank_id

      counts = CATEGORIES.index_with { 0 }
      transition_counts = Hash.new(0)
      customer_ids = previous_results.keys | current_results.keys

      customer_ids.each do |customer_id|
        previous_result = previous_results[customer_id]
        current_result = current_results[customer_id]

        category = classify(
          previous_result: previous_result,
          current_result: current_result,
          previous_ranks: previous_ranks,
          current_ranks: current_ranks,
          previous_no_visit_id: previous_no_visit_id,
          current_no_visit_id: current_no_visit_id
        )

        counts[category] += 1

        key = [
          category,
          state_for(previous_result, previous_no_visit_id),
          previous_result&.fetch(:rank_id),
          state_for(current_result, current_no_visit_id),
          current_result&.fetch(:rank_id)
        ]

        transition_counts[key] += 1
      end

      transitions = transition_counts.map do |key, count|
        category, from_state, from_id, to_state, to_id = key

        {
          category: category,
          from_state: from_state,
          from_rank:
            from_id.nil? ? nil : previous_ranks.fetch(from_id).except(:count),
          to_state: to_state,
          to_rank:
            to_id.nil? ? nil : current_ranks.fetch(to_id).except(:count),
          count: count
        }
      end

      {
        comparison_run_id: previous_run.id,
        counts: counts,
        transitions: transitions
      }
    end

    private

    attr_reader :calculation_run

    def ranks_for(run)
      RunPopulationRowBuilder
        .call(calculation_run: run)
        .fetch(:ranks)
        .index_by { |rank| rank.fetch(:id) }
    end

    def results_for(run)
      run
        .customer_rf_rank_results
        .pluck(:customer_id, :rf_rank_id, :exclusion_reason)
        .each_with_object({}) do |(customer_id, rank_id, reason), results|
          results[customer_id] = {
            rank_id: rank_id,
            reason: reason
          }
        end
    end

    def state_for(result, no_visit_rank_id)
      return :missing if result.nil?

      if result[:reason] == "manual_customer_rank"
        return :excluded
      end

      if result[:reason] == "no_matching_rule" || result[:rank_id].nil?
        return :unmatched
      end

      if result[:rank_id] == no_visit_rank_id
        return :no_visit
      end

      :ranked
end

    def classify(
      previous_result:,
      current_result:,
      previous_ranks:,
      current_ranks:,
      previous_no_visit_id:,
      current_no_visit_id:
    )
      return :added if previous_result.nil?
      return :removed if current_result.nil?

      results = [ previous_result, current_result ]

      if results.any? { |result| result[:reason] == "manual_customer_rank" }
        return :excluded
      end

      if results.any? do |result|
          result[:reason] == "no_matching_rule" || result[:rank_id].nil?
        end
        return :unmatched
      end

      if previous_result[:rank_id] == previous_no_visit_id ||
          current_result[:rank_id] == current_no_visit_id
        return :no_visit
      end

      RankMovementClassifier.call(
        previous_rank: previous_ranks.fetch(previous_result[:rank_id]),
        current_rank: current_ranks.fetch(current_result[:rank_id])
      )
    end
  end
end
