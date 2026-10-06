class RfCalculationRunJob < ApplicationJob
  queue_as :default

  def perform(calculation_run_id)
    calculation_run =
      RfCalculationRun.find(calculation_run_id)

    Rf::CalculationRunner.call(
      calculation_run: calculation_run
    )
  end
end
