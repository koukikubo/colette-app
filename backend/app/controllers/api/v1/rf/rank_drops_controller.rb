class Api::V1::Rf::RankDropsController < Api::V1::BaseController
  rescue_from ::Rf::RankDropSummary::InvalidParameterError,
              with: :render_invalid_parameter

  rescue_from ::Rf::RunPopulationSummary::IncompleteRunError,
              KeyError,
              with: :render_rank_drop_error

  # クエリパラメーターと適用中の履歴をサービスへ渡す。
  def show
    summary = ::Rf::RankDropSummary.call(
      current_run: RfSetting.first&.current_calculation_run,
      start_date: params[:start_date],
      end_date: params[:end_date],
      page: params[:page],
      per_page: params[:per_page]
    )

    render_success(data: summary)
  end

  private

  # 利用者が指定した日付・ページ番号が不正な場合のレスポンス。
  def render_invalid_parameter(error)
    render_error(
      message: "検索条件が不正です",
      errors: [ error.message ],
      status: :bad_request
    )
  end

  # 履歴の未完了やデータ不整合を、対象者なしと区別して返す。
  def render_rank_drop_error(error)
    render_error(
      message: "RFランク低下顧客を取得できません",
      errors: [ error.message ],
      status: :unprocessable_content
    )
  end
end
