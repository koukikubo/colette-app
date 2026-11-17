class Api::V1::DashboardAnalyticsController < Api::V1::BaseController
  rescue_from KeyError, Rf::RunPopulationSummary::IncompleteRunError do
    render_error(message: "RF計算履歴の保存情報が不完全です。管理者に確認してください", status: :unprocessable_content)
  end

  def show
    render_success(data: Dashboard::Analytics.call)
  end
end
