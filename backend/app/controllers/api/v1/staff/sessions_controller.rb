class Api::V1::Staff::SessionsController < Api::V1::BaseController
  before_action :require_staff_login!, only: %i[current]

  MAX_FAILED_ATTEMPTS = 30

  # POST /api/v1/staff/sessions
  def create
    staff = ::Staff.includes(:staff_master).find_by(id: login_params[:staff_id])
    # スタッフが存在しない、パスワードが間違っている、またはログインが許可されていない場合はエラーを返す
    unless staff&.authenticate(login_params[:password]) && staff.login_allowed?
      record_login_failure(staff)

      # セキュリティの観点から、どの条件が失敗したのかは明示せず、一般的なエラーメッセージを返す
      return render_error(
        message: "パスワードが正しくありません。ログインが許可されていない可能性があります。",
        status: :unauthorized
      )
    end

    # ログイン成功時はセッションをリセットしてからスタッフIDを保存する（セッション固定攻撃対策）
    reset_session

    # セッションにスタッフIDと最後のアクセス日時を保存する
    session[:staff_id] = staff.id
    session[:last_access_at] = Time.current

    # ログイン成功後は失敗回数をリセットし、最後のログイン日時を更新する
    staff.update!(
      failed_attempts: 0,
      last_logged_in_at: Time.current
    )
    # 成功レスポンスにはスタッフ情報を含める（パスワードは含めない）
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

  private
  # ログインに必要なパラメータを安全に取得するためのストロングパラメータメソッド
  def login_params
    #expectメソッドを使用して、staffパラメータの中にstaff_idとpasswordが存在することを要求する
    permitted_params = params.expect(staff: %i[staff_id password])
    permitted_params.require(%i[staff_id password])

    permitted_params
  end

  # ログイン失敗回数をインクリメントするヘルパーメソッド
  def record_login_failure(staff)
    return if staff.blank?

    staff.increment!(:failed_attempts)

    return if staff.failed_attempts < MAX_FAILED_ATTEMPTS

    # 一定回数以上の失敗があった場合はログインを無効化する
    staff.update!(login_enabled: false)
  end
end