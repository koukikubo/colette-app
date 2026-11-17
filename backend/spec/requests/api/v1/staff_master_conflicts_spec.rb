require "rails_helper"

RSpec.describe "担当者変更の競合", type: :request do
  include_context "authenticated request"
  let(:login_staff) { create(:staff, staff_master: create(:staff_master, role_code: "owner")) }
  let(:target) { create(:staff_master, role_code: "operator") }
  before { login! }

  it "一覧と詳細に版番号を返す" do
    get "/api/v1/staff_masters/#{target.id}", as: :json
    expect(response.parsed_body.dig("data", "staff_master", "lock_version")).to eq(0)
  end

  it "古い版の編集は409で拒否し新しい名前を保持する" do
    target.update!(name: "先に保存した名前")
    patch "/api/v1/staff_masters/#{target.id}", params: { staff_master: { lock_version: 0, name: "古い名前" } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:conflict)
    expect(target.reload.name).to eq("先に保存した名前")
  end

  %w[update retire restore login_enabled reset_failed_attempts].each do |action|
    it "#{action}で版番号を必須とする" do
      create(:staff, staff_master: target)
      target.update!(retired_on: Date.current) if action == "restore"
      path = "/api/v1/staff_masters/#{target.id}" + (action == "update" ? "" : "/#{action}")
      patch path, params: { staff_master: { name: "変更", retired_on: Date.current }, staff: { login_enabled: false } }, headers: authenticated_headers, as: :json
      expect(response).to have_http_status(:bad_request)
    end

    it "#{action}で古い版なら担当者と認証情報を変更しない" do
      staff = create(:staff, staff_master: target)
      target.update!(memo: "先行更新", retired_on: action == "restore" ? Date.current : nil)
      before_master = target.attributes
      before_staff = staff.attributes
      path = "/api/v1/staff_masters/#{target.id}" + (action == "update" ? "" : "/#{action}")
      patch path, params: { staff_master: { lock_version: 0, name: "変更", retired_on: Date.current }, staff: { login_enabled: false } }, headers: authenticated_headers, as: :json
      expect(response).to have_http_status(:conflict)
      expect(target.reload.attributes).to eq(before_master)
      expect(staff.reload.attributes).to eq(before_staff)
    end
  end
  it "認証情報の更新が失敗した場合は担当者の版も進めない" do
    staff = create(:staff, staff_master: target)
    version = target.lock_version
    patch "/api/v1/staff_masters/#{target.id}/login_enabled",
          params: { staff_master: { lock_version: version }, staff: { login_enabled: nil } },
          headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(target.reload.lock_version).to eq(version)
    expect(staff.reload.login_enabled).to be(true)
  end
end
