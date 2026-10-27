class Api::V1::Rf::CustomerTransitionsController <
  Api::V1::BaseController
  rescue_from Rf::RunPopulationSummary::IncompleteRunError,
              KeyError,
              with: :render_transition_error

  def index
    table =
      Rf::CustomerTransitionTableBuilder.call(
        current_run: current_run
      )

    render_success(
      data: {
        table: table
      }
    )
  end

  def movements
    calculation_run =
      Rf::AppliedRunHistory
        .call(current_run: current_run)
        .find { |run| run.id.to_s == params[:id] }

    unless calculation_run
      raise ActiveRecord::RecordNotFound,
            "適用済みのRF計算履歴が見つかりません"
    end

    movement =
      Rf::CustomerMovementSummary.call(
        calculation_run: calculation_run
      )

    render_success(
      data: {
        calculation_run_id: calculation_run.id,
        movement: movement
      }
    )
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
