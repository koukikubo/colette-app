module Rf
  class RunPopulationSummary
    class IncompleteRunError < StandardError; end

    def self.call(calculation_run:)
      unless calculation_run.status == "completed"
        raise IncompleteRunError,
              "完了していないRF計算結果は集計できません"
      end

      grouped_counts =
        calculation_run
          .customer_rf_rank_results
          .group(:exclusion_reason, :rf_rank_id)
          .count

      rank_counts = {}
      unmatched_count = 0
      excluded_count = 0

      grouped_counts.each do |(reason, rank_id), count|
        case reason
        when "manual_customer_rank"
          excluded_count += count
        when "no_matching_rule"
          unmatched_count += count
        else
          if rank_id.nil?
            unmatched_count += count
          else
            rank_counts[rank_id] =
              rank_counts.fetch(rank_id, 0) + count
          end
        end
      end

      ranked_count = rank_counts.values.sum
      eligible_count = ranked_count + unmatched_count

      {
        rank_counts: rank_counts,
        ranked_count: ranked_count,
        unmatched_count: unmatched_count,
        excluded_count: excluded_count,
        eligible_count: eligible_count,
        total_count: eligible_count + excluded_count
      }
    end
  end
end
