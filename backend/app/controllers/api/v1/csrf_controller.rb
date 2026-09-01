class Api::V1::CsrfController < Api::V1::BaseController
  skip_before_action :require_staff_login!

  def show
    render_success(
      data: {
        csrf_token: form_authenticity_token
      }
    )
  end
end
