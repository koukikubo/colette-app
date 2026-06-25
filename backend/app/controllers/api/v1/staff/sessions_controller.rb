class Api::V1::Staff::SessionsController < Api::V1::BaseController
  before_action :require_staff_login!, only: %i[current]

  # POST /api/v1/staff/sessions
  def create
    staff = ::Staff
              .includes(:staff_master)
              .find_by(id: login_params[:staff_id])

    
    return render_login_error if staff.blank?
    return render_login_error unless staff.login_allowed?

    unless staff.authenticate(login_params[:password])
      staff.record_login_failure!
      return render_login_error
    end

    reset_session

    now = Time.current

    session[:staff_id] = staff.id
    session[:last_access_at] = now

    staff.record_login_success!

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
    # ログアウト時はセッションを完全にリセットして、スタッフIDやその他のセッション情報をすべてクリアする
    reset_session

    # ログアウト成功のレスポンスを返す（必要に応じてメッセージやその他の情報を含めることもできる）
    render_success(
      data: {
        message: "ログアウトしました"
      }
    )
  end

  def login_options
    staffs =
      Staff
        .includes(:staff_master)
        .select(&:login_allowed?)

    render json: {
      status: "success",
      data: {
        staffs: staffs.map do |staff|
          Api::V1::StaffSerializer.new(staff).as_json
        end
      }
    }, status: :ok
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
    #expectメソッドを使用して、staffパラメータの中にstaff_idとpasswordが存在することを要求する
    permitted_params = params.expect(staff: %i[staff_id password])
    permitted_params.require(%i[staff_id password])

    permitted_params
  end
end