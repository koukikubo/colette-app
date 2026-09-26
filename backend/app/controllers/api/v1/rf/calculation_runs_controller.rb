class Api::V1::Rf::CalculationRunsController <
  Api::V1::BaseController
  include ApiPagination

  before_action :require_owner!,
              only: %i[
                create
                activate
                restore
                rollback
              ]

  def index
    pagination = pagination_params
    return unless pagination

    paginated_runs =
      paginate(
        RfCalculationRun
          .includes(
            :rf_rule_set,
            started_by_staff: :staff_master
          )
          .order(created_at: :desc, id: :desc),
        **pagination
      )

    current_run =
      RfSetting.first&.current_calculation_run

    restorable_run_ids =
      collect_previous_run_ids(current_run)

    render_success(
      data: {
        calculation_runs:
          paginated_runs[:records].map do |calculation_run|
            Api::V1::Rf::CalculationRunHistorySerializer
              .new(
                calculation_run,
                current_run_id: current_run&.id,
                restorable_run_ids: restorable_run_ids
              )
              .as_json
          end,
        pagination: paginated_runs[:metadata]
      }
    )
  end

  def show
    calculation_run =
      RfCalculationRun.find(params[:id])

    current_run =
      RfSetting.first&.current_calculation_run

    restorable_run_ids =
      collect_previous_run_ids(current_run)

    render_success(
      data: {
        calculation_run:
          Api::V1::Rf::CalculationRunDetailSerializer
            .new(
              calculation_run,
              current_run_id: current_run&.id,
              restorable_run_ids: restorable_run_ids
            )
            .as_json
      }
    )
  end

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

  def results
    calculation_run =
      RfCalculationRun.find(params[:id])

    pagination = pagination_params
    return unless pagination

    paginated_results =
      paginate(
        calculation_run
          .customer_rf_rank_results
          .includes(:customer, :rf_rank)
          .order(:customer_id),
        **pagination
      )

    results = paginated_results[:records].to_a

    previous_results =
      previous_results_by_customer_id(
        calculation_run,
        results.map(&:customer_id)
      )

    render_success(
      data: {
        results:
          results.map do |result|
            Api::V1::Rf::CustomerRankResultSerializer
              .new(
                result,
                previous_result:
                  previous_results[result.customer_id]
              )
              .as_json
          end,
        pagination: paginated_results[:metadata]
      }
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

  def restore
    target_run =
      RfCalculationRun.find(params[:id])

    expected_current_run_id =
      parsed_expected_current_run_id

    return if performed?

    setting =
      Rf::CalculationRestorer.call(
        target_run: target_run,
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
  rescue Rf::CalculationRestorer::CurrentRunNotFoundError,
         Rf::CalculationRestorer::IncompleteRunError,
         Rf::CalculationRestorer::NotAncestorError => error
    render_error(
      message: "計算結果を復元できません",
      errors: [ error.message ],
      status: :unprocessable_content
    )
  rescue Rf::CalculationRestorer::StaleRunError => error
    render_error(
      message: "計算結果を復元できません",
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

  def expected_current_run_params
    @expected_current_run_params ||=
      params.expect(
        rf_calculation: [
          :expected_current_run_id
        ]
      )
  end

  def parsed_expected_current_run_id
    value =
      expected_current_run_params[
        :expected_current_run_id
      ]
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

  def previous_results_by_customer_id(
    calculation_run,
    customer_ids
  )
    return {} if calculation_run.previous_run.nil?
    return {} if customer_ids.empty?

    calculation_run
      .previous_run
      .customer_rf_rank_results
      .includes(:rf_rank)
      .where(customer_id: customer_ids)
      .index_by(&:customer_id)
  end

  def collect_previous_run_ids(current_run)
    ids = []
    calculation_run = current_run&.previous_run

    while calculation_run
      ids << calculation_run.id
      calculation_run = calculation_run.previous_run
    end

    ids
  end
end
