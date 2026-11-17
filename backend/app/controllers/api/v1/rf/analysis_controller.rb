class Api::V1::Rf::AnalysisController <
  Api::V1::BaseController
  def show
    calculation_run =
      RfSetting.first&.current_calculation_run

    if calculation_run.nil?
      render_success(
        data: {
          analysis: nil
        }
      )

      return
    end

    analysis =
      Rf::CalculationAnalysisBuilder.call(
        calculation_run: calculation_run
      )

    render_success(
      data: {
        analysis:
          Api::V1::Rf::CalculationAnalysisSerializer
            .new(analysis)
            .as_json
      }
    )
  rescue Rf::CalculationAnalysisBuilder::IncompleteRunError =>
    error
    render_error(
      message: "RF分析結果を取得できません",
      errors: [ error.message ],
      status: :unprocessable_content
    )
  end
end
