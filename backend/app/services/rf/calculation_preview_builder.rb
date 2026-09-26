module Rf
  class CalculationPreviewBuilder
    Result = Struct.new(
      :changed_count,
      :unchanged_count,
      :excluded_count,
      :rank_transitions,
      keyword_init: true
    )

    Transition = Struct.new(
      :from_rf_rank,
      :to_rf_rank,
      :count,
      keyword_init: true
    )

    def self.call(calculation_run:)
      new(calculation_run: calculation_run).call
    end

    def initialize(calculation_run:)
      @calculation_run = calculation_run
    end

    def call
      changed_count = 0
      unchanged_count = 0
      excluded_count = 0
      transition_counts = {}

      current_results.each do |current_result|
        if current_result.exclusion_reason.present?
          excluded_count += 1
          next
        end

        previous_result =
          previous_results_by_customer_id[
            current_result.customer_id
          ]

        if unchanged_result?(
          previous_result,
          current_result
        )
          unchanged_count += 1
          next
        end

        changed_count += 1

        add_transition(
          transition_counts,
          previous_result,
          current_result
        )
      end

      Result.new(
        changed_count: changed_count,
        unchanged_count: unchanged_count,
        excluded_count: excluded_count,
        rank_transitions:
          sorted_transitions(transition_counts)
      )
    end

    private

    attr_reader :calculation_run

    def current_results
      @current_results ||=
        calculation_run
          .customer_rf_rank_results
          .includes(:rf_rank)
          .to_a
    end

    def previous_results_by_customer_id
      @previous_results_by_customer_id ||=
        if calculation_run.previous_run.nil?
          {}
        else
          calculation_run
            .previous_run
            .customer_rf_rank_results
            .includes(:rf_rank)
            .index_by(&:customer_id)
        end
    end

    def unchanged_result?(previous_result, current_result)
      return false if previous_result.nil?
      return false if previous_result.exclusion_reason.present?

      previous_result.rf_rank_id ==
        current_result.rf_rank_id
    end

    def add_transition(
      transition_counts,
      previous_result,
      current_result
    )
      key = [
        previous_result&.rf_rank_id,
        current_result.rf_rank_id
      ]

      transition =
        transition_counts[key] ||=
          Transition.new(
            from_rf_rank: previous_result&.rf_rank,
            to_rf_rank: current_result.rf_rank,
            count: 0
          )

      transition.count += 1
    end

    def sorted_transitions(transition_counts)
      transition_counts
        .values
        .sort_by do |transition|
        [
          transition.from_rf_rank&.position || -1,
          transition.to_rf_rank.position
        ]
      end
    end
  end
end
