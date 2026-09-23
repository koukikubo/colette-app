class Api::V1::Rf::CalculationRunsController <
  Api::V1::BaseController
  def create
    base_date = parsed_base_date
    return if performed?

    calculation_run =
      Rf::CalculationRunner.call(
        rule_set: rf_rule_set,
        base_date: base_date,
        started_by_staff: current_staff
      )

    render_success(
      data: {
        calculation_run:
          Api::V1::Rf::CalculationRunSerializer
            .new(calculation_run)
            .as_json
      },
      status: :created
    )
  rescue Rf::CalculationRunner::InvalidRuleSetError => error
    render_error(
      message: "RFランクを計算できません",
      errors: [ error.message ],
      status: :unprocessable_content
    )
  end

  def activate
    calculation_run =
      RfCalculationRun.find(params[:id])

    setting =
      Rf::CalculationActivator.call(
        calculation_run: calculation_run
      )

    render_success(
      data: {
        calculation_run:
          serialize_calculation_run(calculation_run),
        current_calculation_run_id:
          setting.current_calculation_run_id
      }
    )
  rescue Rf::CalculationActivator::IncompleteRunError => error
    render_error(
      message: "計算結果を適用できません",
      errors: [ error.message ],
      status: :unprocessable_content
    )
  rescue Rf::CalculationActivator::StaleRunError => error
    render_error(
      message: "計算結果を適用できません",
      errors: [ error.message ],
      status: :conflict
    )
  end

  def rollback
    expected_current_run_id =
      parsed_expected_current_run_id

    return if performed?

    setting = Rf::CalculationRollback.call(
      expected_current_run_id: expected_current_run_id
    )

    current_calculation_run =
      setting.current_calculation_run

    render_success(
      data: {
        calculation_run:
          serialize_calculation_run(
            current_calculation_run
          ),
        current_calculation_run_id:
          current_calculation_run.id
      }
    )
  rescue Rf::CalculationRollback::CurrentRunNotFoundError,
          Rf::CalculationRollback::PreviousRunNotFoundError => error
    render_error(
      message: "計算結果を復元できません",
      errors: [ error.message ],
      status: :unprocessable_content
    )
    rescue Rf::CalculationRollback::StaleRunError => error
      render_error(
        message: "計算結果を復元できません",
        errors: [ error.message ],
        status: :conflict
      )
  end

  private

  def rollback_params
    @rollback_params ||=
      params.expect(
        rf_calculation: [
          :expected_current_run_id
        ]
      )
  end

  def parsed_expected_current_run_id
    value = rollback_params[:expected_current_run_id]

    if value.blank?
      raise ActionController::ParameterMissing.new(
        :expected_current_run_id
      )
    end

    Integer(value.to_s, 10)
  rescue ArgumentError, TypeError
    render_error(
      message: "計算履歴IDが不正です",
      errors: [
        "expected_current_run_idは整数で指定してください"
      ],
      status: :bad_request
    )

    nil
  end

  def calculation_params
    @calculation_params ||=
      params.expect(
        rf_calculation: %i[
          rf_rule_set_id
          base_date
        ]
      )
  end

  def rf_rule_set
    id = calculation_params[:rf_rule_set_id]

    if id.blank?
      raise ActionController::ParameterMissing.new(
        :rf_rule_set_id
      )
    end

    RfRuleSet.find(id)
  end

  def parsed_base_date
    value = calculation_params[:base_date]

    if value.blank?
      raise ActionController::ParameterMissing.new(
        :base_date
      )
    end

    Date.iso8601(value.to_s)
  rescue Date::Error
    render_error(
      message: "基準日が不正です",
      errors: [
        "base_dateはYYYY-MM-DD形式で指定してください"
      ],
      status: :bad_request
    )

    nil
  end

  def serialize_calculation_run(calculation_run)
    Api::V1::Rf::CalculationRunSerializer
      .new(calculation_run)
      .as_json
  end
end
