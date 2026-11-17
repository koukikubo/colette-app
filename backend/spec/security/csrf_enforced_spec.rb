require "rails_helper"

RSpec.describe "CSRF保護を有効にした認証", type: :request do
  include_context "authenticated request"

  around do |example|
    previous = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = true
    example.run
  ensure
    ActionController::Base.allow_forgery_protection = previous
  end

  it "トークンなしのログインを拒否する" do
    post "/api/v1/staff/login", params: { staff: { staff_id: login_staff.id, password: login_password } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(StaffSession.count).to eq(0)
  end

  it "正規トークンではログインできる" do
    login!
    get "/api/v1/staff/current"
    expect(response).to have_http_status(:ok)
  end
end
