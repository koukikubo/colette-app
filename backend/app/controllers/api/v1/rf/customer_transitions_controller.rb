class Api::V1::Rf::CustomerTransitionsController <
  Api::V1::BaseController
  rescue_from Rf::MonthComparisonPeriod::InvalidPeriodError,
              Rf::MonthComparison::UnavailableError,
              Rf::RunPopulationSummary::IncompleteRunError,
              KeyError,
              with: :render_transition_error

  def compare
    comparison = Rf::MonthComparison.call(
      current_run: current_run,
      start_month: params[:start_month],
      end_month: params[:end_month]
    )
    render_success(data: comparison)
  end

  private

  def current_run
    @current_run ||=
      RfSetting.first&.current_calculation_run
  end

  def render_transition_error(error)
    render_error(
      message: "RFランク客層変動表を取得できません",
      errors: [ error.message ],
      status: :unprocessable_content
    )
  end
end
