RSpec.shared_context "authenticated request" do
  let(:login_password) { "Password123!" }

  let(:login_staff) do
    create(
      :staff,
      password: login_password,
      password_confirmation: login_password
    )
  end

  # ログインや更新リクエストで使用するCSRFトークンを取得する。
  def fetch_csrf_token
    get "/api/v1/csrf", as: :json

    expect(response).to have_http_status(:ok), response.body

    response_body = JSON.parse(response.body)
    token =
      response_body.dig("data", "csrf_token") ||
      response_body["csrf_token"]

    expect(token).to be_present, response.body

    token
  end

  def csrf_headers(token = fetch_csrf_token)
    {
      "X-CSRF-Token" => token
    }
  end

  def authenticated_headers
    csrf_headers(@authenticated_csrf_token)
  end

  # ログインAPIを通して、Request Specのセッションを認証済みにする。
  def login!
    token = fetch_csrf_token

    post(
      "/api/v1/staff/login",
      params: {
        staff: {
          staff_id: login_staff.id,
          password: login_password
        }
      },
      headers: csrf_headers(token),
      as: :json
    )

    expect(response).to have_http_status(:ok), response.body

    # ログイン時にセッションが再生成されるため、CSRFトークンも再取得する。
    @authenticated_csrf_token = fetch_csrf_token
  end
end
