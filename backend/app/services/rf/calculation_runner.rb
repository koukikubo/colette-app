module Rf
  class CalculationRunner
    def self.call(calculation_run:, recover: false, retry_failed: false)
      new(
        calculation_run: calculation_run, recover: recover, retry_failed: retry_failed
      ).call
    end

    def initialize(calculation_run:, recover: false, retry_failed: false)
      @calculation_run = calculation_run
      @recover = recover
      @retry_failed = retry_failed
    end

    def call
      ActiveRecord::Base.connection_pool.with_connection do |connection|
        locked = connection.select_value("SELECT pg_try_advisory_lock(431903, #{calculation_run.id.to_i})")
        return calculation_run unless locked
        begin
          call_under_lock
        ensure
          connection.execute("SELECT pg_advisory_unlock(431903, #{calculation_run.id.to_i})")
        end
      end
    end

    def call_under_lock
      claimed = calculation_run.with_lock do
        next false unless calculation_run.status == "pending" || (@recover && calculation_run.status == "processing") || (@retry_failed && calculation_run.status == "failed")

        calculation_run.update!(
          status: "processing",
          started_at: Time.current
        )

        true
      end

      return calculation_run unless claimed

      calculate_all_customers!(calculation_run)

      calculation_run
    rescue StandardError => error
      mark_as_failed(calculation_run, error)
      raise
    end

    private
    attr_reader :calculation_run

    def rule_set
      calculation_run.rf_rule_set
    end

    def base_date
      calculation_run.base_date
    end

    def calculate_all_customers!(calculation_run)
      customer_count = 0
      excluded_count = 0

      ActiveRecord::Base.transaction do
        # 強制終了後に再配信された場合も、途中結果を二重作成しない。
        calculation_run.customer_rf_rank_results.delete_all if @recover
        target_customers.find_each do |customer|
          if customer.excluded_from_rf_calculation?
            create_excluded_result!(
              calculation_run,
              customer
            )

            excluded_count += 1
          else
            create_calculated_result!(
              calculation_run,
              customer
            )
          end

          customer_count += 1
        end

        calculation_run.update!(
          status: "completed",
          customer_count: customer_count,
          excluded_count: excluded_count,
          rf_rank_snapshots: build_rf_rank_snapshots,
          unmatched_count: 0,
          completed_at: Time.current,
          failure_message: nil
        )
      end
    end

    def create_excluded_result!(calculation_run, customer)
      calculation_run.customer_rf_rank_results.create!(
        customer: customer,
        exclusion_reason: "manual_customer_rank",
        frequency_count: 0
      )
    end

    def create_calculated_result!(calculation_run, customer)
      calculation =
        Rf::CustomerRankCalculator.call(
          customer: customer,
          rule_set: rule_set,
          base_date: base_date
        )

      calculation_run.customer_rf_rank_results.create!(
        customer: customer,
        rf_rank: calculation.rf_rank,
        recency_days: calculation.recency_days,
        frequency_count: calculation.frequency_count,
        last_visit_on: calculation.last_visit_on
      )
    end

    def build_rf_rank_snapshots
      mapped_ids =
        rule_set.rank_mappings.pluck(:rf_rank_id)

      result_ids =
        calculation_run
          .customer_rf_rank_results
          .where.not(rf_rank_id: nil)
          .distinct
          .pluck(:rf_rank_id)

      rank_ids =
        (mapped_ids + result_ids + active_no_visit_rank_ids).uniq

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

    def active_no_visit_rank_ids
      StandardListMaster
        .active_rf_ranks
        .where(id: rule_set.no_visit_rank_id)
        .pluck(:id)
    end

    def target_customers
      Customer
        .includes(:customer_rank)
        .where(hidden_at: nil)
    end

    def mark_as_failed(calculation_run, error)
      return if calculation_run.blank?
      return unless calculation_run.persisted?

      calculation_run.reload
      return unless calculation_run.status == "processing"

      calculation_run.update!(
        status: "failed",
        completed_at: Time.current,
        failure_message: error.message
      )
    end
  end
end
