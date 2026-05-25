class Api::V1::BaseController < ApplicationController
  # protect_from_forgery with: :null_session

  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActionController::ParameterMissing, with: :render_bad_request
  rescue_from ActionController::InvalidAuthenticityToken,
            with: :render_invalid_authenticity_token
  # 本番環境用の例外処理
  # rescue_from StandardError, with: :render_internal_server_error


  private
  # セッションから現在のスタッフを取得するヘルパーメソッド
  def current_staff
    return nil if session[:staff_id].blank?

    @current_staff ||= Staff.includes(:staff_master).find_by(id: session[:staff_id])
  end

  # スタッフがログイン中かどうかを判定
  def staff_logged_in?
    current_staff.present?
  end

  # ログイン必須API用の認証チェック
  def require_staff_login!
    return if staff_logged_in?

    render_error(
      message: "ログインが必要です",
      status: :unauthorized
    )
  end

  # 正常系JSONレスポンス統一
  def render_success(data: {}, status: :ok)
    render json: {
        status: "success",
        data: data 
        }, status: status
  end

  # リクエストパラメータが不正な場合のレスポンス
  def render_bad_request(error)
    render_error(
      message: "リクエストパラメータが不正です",
      errors: [error.message],
      status: :bad_request
    )
  end
  
  # 異常系JSONレスポンス統一
  def render_error(
    message: "An error occurred",
    errors: [],
    status: :unprocessable_entity
  )
    render json: {
        status: "error",
        message: message,
        errors: errors
        }, status: status
  end

  # CSRFトークンが不正な場合のレスポンス
  def render_invalid_authenticity_token(error)
    render_error(
      message: "CSRFトークンが不正です",
      errors: [error.message],
      status: :unprocessable_entity
    )
  end
  
  # ActiveRecord::RecordNotFound例外をキャッチして404エラーを返す
  def render_not_found(error)
    render_error(
      message: "データが見つかりませんでした",
      errors: [error.message],
      status: :not_found
    )    
  end

  def render_internal_server_error(error)
    logger.error error.message
    logger.error error.backtrace.join("\n")

    render_error(
      message: "サーバーエラーが発生しました",
      errors: [error.message],
      status: :internal_server_error
    )    
  end
end
