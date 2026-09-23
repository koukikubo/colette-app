class Api::V1::Rf::CalculationRunDetailSerializer <
  ApplicationSerializer
  def initialize(
    resource,
    current_run_id:,
    restorable_run_ids:
  )
    super(resource)

    @current_run_id = current_run_id
    @restorable_run_ids = restorable_run_ids
  end

  def as_json
    Api::V1::Rf::CalculationRunSerializer
      .new(resource)
      .as_json
      .merge(
        current: current?,
        restorable: restorable?
      )
  end

  private

  attr_reader :current_run_id, :restorable_run_ids

  def current?
    resource.id == current_run_id
  end

  def restorable?
    resource.status == "completed" &&
      restorable_run_ids.include?(resource.id)
  end
end
