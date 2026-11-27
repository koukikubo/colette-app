require "rails_helper"

RSpec.describe "担当者本人の案内状態", type: :request do
  include_context "authenticated request"

  def save_state(status, **extra)
    patch "/api/v1/staff/guide_state", params: { guide_state: { guide_version: 1, status: status, **extra } }, headers: authenticated_headers, as: :json
  end

  it "未認証を拒否し、未確認の取得ではレコードを作らない" do
    get "/api/v1/staff/guide_state", as: :json
    expect(response).to have_http_status(:unauthorized)
    login!
    expect { get "/api/v1/staff/guide_state", as: :json }.not_to change(StaffGuideState, :count)
    expect(response.parsed_body.dig("data", "guide_state")).to include("guide_version" => 1, "status" => "unseen", "updated_at" => nil)
  end

  it "すべての役割で本人のスキップ・完了だけを保存し、他人のIDを受け付けない" do
    login!
    other = create(:staff, staff_master: create(:staff_master, role_code: "owner"))
    %w[owner operator viewer].each do |role|
      login_staff.staff_master.update!(role_code: role)
      login!
      # 認証セッションの権限も毎回API側で再確認する。
      save_state("skipped", staff_id: other.id)
      expect(response).to have_http_status(:ok), response.body
      expect(StaffGuideState.where(staff: other)).to be_empty
      save_state("completed")
      expect(response.parsed_body.dig("data", "guide_state", "status")).to eq("completed")
    end
    expect(StaffGuideState.where(staff: login_staff).count).to eq(1)
  end

  it "別のログインからも保持し、再送や遅れたスキップで完了を戻さない" do
    login!
    save_state("completed")
    updated_at = StaffGuideState.last.updated_at
    save_state("skipped")
    expect(response.parsed_body.dig("data", "guide_state", "status")).to eq("completed")
    save_state("completed")
    expect(StaffGuideState.last.updated_at).to eq(updated_at)
    login!
    get "/api/v1/staff/guide_state", as: :json
    expect(response.parsed_body.dig("data", "guide_state", "status")).to eq("completed")
  end

  it "不明な版・状態を保存せず、CSRFなしの更新を拒否する" do
    login!
    [ { guide_version: 2 }, { guide_version: "1" }, { guide_version: 1.0 }, { status: "unknown" } ].each do |extra|
      save_state("skipped", **extra)
      expect(response).to have_http_status(:bad_request), response.body
    end
    patch "/api/v1/staff/guide_state", params: { guide_state: { guide_version: 1, status: "completed" } }, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(StaffGuideState.count).to eq(0)
  end
end
