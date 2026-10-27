module Rf
  class CustomerTransitionTableBuilder
    def self.call(current_run:)
      runs =
        AppliedRunHistory.call(
          current_run: current_run
        )

      sorted_runs =
        runs.sort_by do |run|
          [ run.base_date, run.id ]
        end.reverse

      rows = sorted_runs.map do |run|
        RunPopulationRowBuilder.call(
          calculation_run: run
        )
      end

      {
        current_calculation_run_id: current_run&.id,
        rows: rows
      }
    end
  end
end
