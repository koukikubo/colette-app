# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Staff::Sessions", type: :request do
  let!(:staff_master) do
    StaffMaster.create!(
      code: "STF001",
      name: "オーナー",
      role_code: "owner",
      employment_started_on: Date.current,
      memo: "初期オーナーアカウント"
    )
  end

  let!(:staff) do
    Staff.create!(
      staff_master: staff_master,
      password: "password",
      password_confirmation: "password",
      login_enabled: true,
      failed_attempts: 0
    )
  end

  def response_body
    JSON.parse(response.body)
  end

  def fetch_csrf_token
    get "/api/v1/csrf"

    response_body.dig("data", "csrf_token")
  end

  def login_with(password: "password")
    csrf_token = fetch_csrf_token

    post "/api/v1/staff/login",
         params: {
           staff: {
             staff_id: staff.id,
             password: password
           }
         },
         headers: {
           "X-CSRF-Token" => csrf_token
         },
         as: :json
  end

  describe "POST /api/v1/staff/login" do
    it "正しいログイン情報の場合、ログインに成功すること" do
      login_with

      expect(response).to have_http_status(:ok)

      body = response_body

      expect(body["status"]).to eq("success")
      expect(body.dig("data", "staff", "id")).to eq(staff.id)
      expect(body.dig("data", "staff", "staff_master", "role_code")).to eq("owner")
      expect(body.dig("data", "staff", "login_enabled")).to eq(true)
    end

    it "ログイン成功時にpassword_digestを返さないこと" do
      login_with

      staff_response = response_body.dig("data", "staff")

      expect(staff_response).not_to have_key("password_digest")
    end

    it "ログイン成功時にfailed_attemptsを0に戻し、last_logged_in_atを更新すること" do
      staff.update!(failed_attempts: 3, last_logged_in_at: nil)

      login_with

      expect(response).to have_http_status(:ok)

      staff.reload

      expect(staff.failed_attempts).to eq(0)
      expect(staff.last_logged_in_at).to be_present
    end

    it "パスワードが不正な場合、401を返すこと" do
      login_with(password: "wrong-password")

      expect(response).to have_http_status(:unauthorized)

      body = response_body

      expect(body["status"]).to eq("error")
      expect(body["message"]).to eq("パスワードが正しくありません。ログインが許可されていない可能性があります。")
    end

    it "パスワードが不正な場合、failed_attemptsを1増やすこと" do
      expect do
        login_with(password: "wrong-password")
      end.to change { staff.reload.failed_attempts }.by(1)
    end

    it "必須パラメータが不足している場合、400を返すこと" do
      csrf_token = fetch_csrf_token

      post "/api/v1/staff/login",
           params: {
             staff: {
               password: "password"
             }
           },
           headers: {
             "X-CSRF-Token" => csrf_token
           },
           as: :json

      expect(response).to have_http_status(:bad_request)

      body = response_body

      expect(body["status"]).to eq("error")
      expect(body["message"]).to eq("リクエストパラメータが不正です")
    end
  end

  describe "GET /api/v1/staff/current" do
    it "ログイン中の場合、現在のスタッフ情報を返すこと" do
      login_with

      get "/api/v1/staff/current"

      expect(response).to have_http_status(:ok)

      body = response_body

      expect(body["status"]).to eq("success")
      expect(body.dig("data", "staff", "id")).to eq(staff.id)
      expect(body.dig("data", "staff", "staff_master", "name")).to eq("オーナー")
    end

    it "未ログインの場合、401を返すこと" do
      get "/api/v1/staff/current"

      expect(response).to have_http_status(:unauthorized)

      body = response_body

      expect(body["status"]).to eq("error")
      expect(body["message"]).to eq("ログインが必要です")
    end
  end

  describe "DELETE /api/v1/staff/logout" do
    it "ログアウトできること" do
      login_with

      csrf_token = fetch_csrf_token

      delete "/api/v1/staff/logout",
             headers: {
               "X-CSRF-Token" => csrf_token
             }

      expect(response).to have_http_status(:ok)

      body = response_body

      expect(body["status"]).to eq("success")
      expect(body.dig("data", "message")).to eq("ログアウトしました")
    end

    it "ログアウト後はcurrentが401になること" do
      login_with

      csrf_token = fetch_csrf_token

      delete "/api/v1/staff/logout",
             headers: {
               "X-CSRF-Token" => csrf_token
             }

      get "/api/v1/staff/current"

      expect(response).to have_http_status(:unauthorized)

      body = response_body

      expect(body["status"]).to eq("error")
      expect(body["message"]).to eq("ログインが必要です")
    end
  end
end