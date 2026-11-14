class Api::V1::Staff::SessionsController < Api::V1::BaseController
  skip_before_action :require_staff_login!, only: %i[create destroy]

  # POST /api/v1/staff/sessions
  def create
    permitted = login_params
    ip_allowed = LoginThrottle.allowed?("ip:#{request.remote_ip}", limit: 20)
    staff_id = Integer(permitted[:staff_id].to_s, 10, exception: false)
    return render_login_error unless staff_id&.positive? && permitted[:password].is_a?(String) && permitted[:password].bytesize <= 72
    account_allowed = LoginThrottle.allowed?("account:#{staff_id}", limit: 5)
    unless ip_allowed && account_allowed
      response.set_header("Retry-After", "60")
      return render_error(message: "ログイン試行が多すぎます。1分後に再試行してください。", status: :too_many_requests)
    end

    staff = ::Staff
              .includes(:staff_master)
              .find_by(id: staff_id)


    return render_login_error if staff.blank?
    return render_login_error unless staff.login_allowed?

    unless staff.authenticate(login_params[:password])
      staff.record_login_failure!
      return render_login_error
    end

    # 利用停止・パスワード変更と発行処理を同じ順序で直列化する。
    ::Staff.transaction do
      Security::OwnerGuard.lock!
      staff.reload
      staff.staff_master.reload
      return render_login_error unless staff.login_allowed? && staff.authenticate(permitted[:password])
      reset_session
      staff.record_login_success!
      session[:staff_token] = StaffSession.issue!(staff)
    end

    render_success(
      data: {
        staff: Api::V1::StaffSerializer.new(staff).as_json
      }
    )
  end

  # GET /api/v1/staff/sessions/current
  def current
    # current_staffはBaseControllerのヘルパーメソッドで、セッションから現在のスタッフを取得する
    render_success(
      data: {
        staff: Api::V1::StaffSerializer.new(current_staff).as_json
      }
    )
  end

  # DELETE /api/v1/staff/sessions
  def destroy
    StaffSession.for_token(session[:staff_token]).delete_all
    # ログアウト時はセッションを完全にリセットして、スタッフIDやその他のセッション情報をすべてクリアする
    reset_session

    # ログアウト成功のレスポンスを返す（必要に応じてメッセージやその他の情報を含めることもできる）
    render_success(
      data: {
        message: "ログアウトしました"
      }
    )
  end

  private

  def valid_password?(staff)
    staff.present? && staff.authenticate(login_params[:password])
  end

  def render_login_error
    render_error(
      message: "パスワードが正しくありません。ログインが許可されていない可能性があります。",
      status: :unauthorized
    )
  end

  # ログインに必要なパラメータを安全に取得するためのストロングパラメータメソッド
  def login_params
    # expectメソッドを使用して、staffパラメータの中にstaff_idとpasswordが存在することを要求する
    permitted_params = params.expect(staff: %i[staff_id password])
    permitted_params.require(%i[staff_id password])

    permitted_params
  end
end
