module Rf
  class RunPopulationRowBuilder
    def self.call(calculation_run:)
      new(calculation_run: calculation_run).call
    end

    def initialize(calculation_run:)
      @calculation_run = calculation_run
    end

    def call
      summary =
        RunPopulationSummary.call(
          calculation_run: calculation_run
        )

      ranks = build_ranks(summary.fetch(:rank_counts))

      summary.merge(
        calculation_run_id: calculation_run.id,
        previous_run_id: calculation_run.previous_run_id,
        base_date: calculation_run.base_date,
        ranks: ranks
      )
    end

    private

    attr_reader :calculation_run

    def build_ranks(counts)
      snapshots =
        calculation_run.rf_rank_snapshots ||
          legacy_rank_snapshots(counts)

      ranks = snapshots.map do |snapshot|
        rank_id = snapshot.fetch("id")

        {
          id: rank_id,
          display_code:
            snapshot.fetch("display_code") do
              rank_id.to_s.rjust(5, "0")
            end,
          label: snapshot.fetch("label"),
          display_color: snapshot.fetch("display_color"),
          position: snapshot.fetch("position"),
          count: counts.fetch(rank_id, 0)
        }
      end

      missing_ids = counts.keys - ranks.map { |rank| rank.fetch(:id) }

      if missing_ids.any?
        raise KeyError,
              "計算履歴にRFランクID #{missing_ids.join(', ')}の情報がありません"
      end

      ranks.sort_by do |rank|
        [ rank.fetch(:position), rank.fetch(:id) ]
      end
    end

    def legacy_rank_snapshots(counts)
      rule_set = calculation_run.rf_rule_set

      no_visit_ids =
        StandardListMaster
          .active_rf_ranks
          .where(id: rule_set.no_visit_rank_id)
          .pluck(:id)

      rank_ids =
        (
          rule_set.rank_mappings.pluck(:rf_rank_id) +
          counts.keys +
          no_visit_ids
        ).uniq

      StandardListMaster
        .where(id: rank_ids)
        .ordered
        .map do |rank|
          {
            "id" => rank.id,
            "display_code" => rank.display_code,
            "label" => rank.label,
            "display_color" => rank.display_color,
            "position" => rank.position
          }
        end
    end
  end
end
