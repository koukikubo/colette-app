module PasswordChangeErrors
  extend ActiveSupport::Concern
  included do
    rescue_from Security::PasswordChanger::WrongPassword do
      render_error(message: "現在のパスワードが正しくありません", status: :unprocessable_content)
    end
    rescue_from Security::PasswordChanger::Forbidden do
      render_error(message: "この操作を行う権限がありません", status: :forbidden)
    end
    rescue_from Security::PasswordChanger::Throttled do
      response.set_header("Retry-After", "60")
      render_error(message: "試行が多すぎます。1分後に再試行してください", status: :too_many_requests)
    end
  end
end
