require "rails_helper"
RSpec.describe "自動取得と無操作期限", type: :request do
  include_context "authenticated request"
  include ActiveSupport::Testing::TimeHelpers
  it "閲覧の自動取得は期限を延ばさず、操作通知だけが期限を更新する" do
    travel_to Time.zone.local(2026, 11, 13, 12) do
      login!
      record = StaffSession.where(staff: login_staff).first!
      initial = record.last_seen_at
      travel 5.minutes
      get "/api/v1/customers"
      expect(response).to have_http_status(:ok)
      expect(record.reload.last_seen_at).to eq(initial)
      get "/api/v1/staff/current"
      expect(response).to have_http_status(:ok)
      expect(record.reload.last_seen_at).to eq(Time.current)
      travel 4.hours
      get "/api/v1/customers"
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
