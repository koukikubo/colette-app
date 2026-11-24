class Api::V1::CustomerAnalyticsController < Api::V1::BaseController
  rescue_from ::Customers::CurrentRfQuery::IncompleteHistoryError do |error|
    render_error(message: error.message, status: :unprocessable_content)
  end

  # 明細取得を伴わずに初期画面の集計と適用履歴のRF選択肢を返す。
  def show
    render_success(data: ::Customers::Analytics.call.merge(rf_reference: ::Customers::CurrentRfQuery.new.reference))
  end
end
