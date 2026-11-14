require "rails_helper"

RSpec.describe "本番セキュリティ境界", type: :request do
  include_context "authenticated request"
  include ActiveSupport::Testing::TimeHelpers

  it "ログアウト後はコピーした旧Cookieでも認証できない" do
    login!
    old_cookie = response.request.headers["Cookie"]
    delete "/api/v1/staff/logout", headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:ok)
    get "/api/v1/staff/current", headers: { "Cookie" => old_cookie }
    expect(response).to have_http_status(:unauthorized)
    expect(StaffSession.where(staff: login_staff)).to be_empty
  end

  it "無操作期限を超えると401になる" do
    login!
    travel 31.minutes do
      get "/api/v1/staff/current"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  it "利用が続いていても絶対期限を超えると401になる" do
    login!
    travel (12.hours + 1.second) do
      StaffSession.update_all(last_seen_at: Time.current)
      get "/api/v1/staff/current"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  it "利用停止と再有効化で旧セッションは復活しない" do
    login!
    login_staff.update!(login_enabled: false)
    login_staff.update!(login_enabled: true)
    get "/api/v1/staff/current"
    expect(response).to have_http_status(:unauthorized)
  end

  it "viewerは予約を書き込めない" do
    login_staff.staff_master.update!(role_code: "viewer")
    login!
    expect { post "/api/v1/reservations", params: { reservation: {} }, headers: authenticated_headers, as: :json }.not_to change(Reservation, :count)
    expect(response).to have_http_status(:forbidden)
  end

  it "ID表記を変えてもログインAPIのアカウント制限を回避できない" do
    token = fetch_csrf_token
    6.times do |index|
      post "/api/v1/staff/login", params: { staff: { staff_id: "#{'0' * index}#{login_staff.id}", password: "incorrect-password" } }, headers: csrf_headers(token), as: :json
    end
    expect(response).to have_http_status(:too_many_requests)
    expect(response.headers["Retry-After"]).to eq("60")
  end

  it "アカウント単位の試行回数を制限する" do
    5.times { expect(LoginThrottle.allowed?("test:account", limit: 5)).to be(true) }
    expect(LoginThrottle.allowed?("test:account", limit: 5)).to be(false)
    travel 61.seconds do
      expect(LoginThrottle.allowed?("test:account", limit: 5)).to be(true)
    end
  end

  it "最後のオーナーの降格・ログイン停止を防ぐ" do
    login_staff.staff_master.update!(role_code: "owner")
    expect(login_staff.staff_master.update(role_code: "operator")).to be(false)
    expect(login_staff.update(login_enabled: false)).to be(false)
  end

  it "短いパスワードを拒否する" do
    expect(build(:staff, password: "short", password_confirmation: "short")).not_to be_valid
  end
end
