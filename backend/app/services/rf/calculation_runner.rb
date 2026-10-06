module Rf
  class CalculationRunner
    def self.call(calculation_run:)
      new(
        calculation_run: calculation_run
      ).call
    end

    def initialize(calculation_run:)
      @calculation_run = calculation_run
    end

    def call
      calculation_run.update!(
        status: "processing",
        started_at: Time.current
      )

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

    def target_customers
      Customer
        .includes(:customer_rank)
        .where(hidden_at: nil)
    end

    def mark_as_failed(calculation_run, error)
      return if calculation_run.blank?
      return unless calculation_run.persisted?

      calculation_run.update!(
        status: "failed",
        completed_at: Time.current,
        failure_message: error.message
      )
    end
  end
end
