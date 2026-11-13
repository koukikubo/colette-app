class Api::V1::Staff::PasswordsController < Api::V1::BaseController
  include PasswordChangeErrors

  def update
    Security::PasswordChanger.call(actor: current_staff, subject: current_staff,
                                  attributes: params.require(:staff).permit(:current_password, :password, :password_confirmation))
    reset_session
    render_success(data: { message: "パスワードを変更しました。再認証してください" })
  end
end
