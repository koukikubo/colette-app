class Api::V1::Rf::CustomersController < Api::V1::BaseController
  include ApiPagination
  rescue_from Rf::RunPopulationSummary::IncompleteRunError, KeyError do
    render_error(message: "RF計算履歴の保存情報が不完全です。管理者に確認してください", status: :unprocessable_content)
  end

  STATES = %w[missing excluded unmatched no_visit ranked].freeze

  def index
    paging = pagination_params
    return unless paging
    filters = params.permit(:rf_rank_id, :recency_rule_id, :frequency_rule_id, :category, :from_state, :to_state, :from_rank_id, :to_rank_id)
    if filters[:category].present? && !Rf::CustomerMovementSummary::CATEGORIES.map(&:to_s).include?(filters[:category])
      raise ActionController::BadRequest, "移動区分が不正です"
    end
    %i[from_state to_state].each do |key|
      raise ActionController::BadRequest, "状態が不正です" if filters[key].present? && !STATES.include?(filters[key])
    end
    runs = Rf::AppliedRunHistory.call(current_run: RfSetting.first&.current_calculation_run)
    run = selected_run(runs, params[:run_id])
    previous = params[:comparison_run_id].present? ? selected_run(runs, params[:comparison_run_id]) : nil
    if previous && (previous.rf_rule_set_id != run.rf_rule_set_id || previous.base_date > run.base_date)
      raise ActionController::BadRequest, "同じRFルールで基準日の順に比較してください"
    end
    if previous && %i[rf_rank_id recency_rule_id frequency_rule_id].any? { |key| filters[key].present? }
      raise ActionController::BadRequest, "比較の内訳には開始・終了の状態とランクを指定してください"
    end
    if !previous && %i[category from_state to_state from_rank_id to_rank_id].any? { |key| filters[key].present? }
      raise ActionController::BadRequest, "移動条件には比較元の計算履歴が必要です"
    end
    query = Rf::CustomerListQuery.new(run: run, previous: previous)
    page = paginate(query.call(filters), **paging)
    render_success(data: { run: { id: run.id, base_date: run.base_date }, comparison_run: previous ? { id: previous.id, base_date: previous.base_date } : nil,
                           cell_labels: query.cell_labels, ranks: query.ranks.values, comparison_ranks: query.previous_ranks.values, filters: filters.to_h, customers: page[:records].map { |customer| query.serialize(customer) }, pagination: page[:metadata] })
  end

  private

  def selected_run(runs, value)
    id = Integer(value.to_s, 10, exception: false)
    run = runs.find { |item| item.id == id && item.status == "completed" }
    raise ActiveRecord::RecordNotFound, "適用済みの完了した計算履歴を指定してください" unless run
    run
  end
end
