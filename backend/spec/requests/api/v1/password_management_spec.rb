require "rails_helper"

RSpec.describe "パスワード管理", type: :request do
  include_context "authenticated request"
  let(:new_password) { "ChangedPassword456!" }
  before { login! }

  it "本人の変更で全セッションを失効し秘密を返さない" do
    old = StaffSession.issue!(login_staff)
    patch "/api/v1/staff/password", params: { staff: { current_password: login_password, password: new_password, password_confirmation: new_password } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:ok)
    expect(login_staff.reload.authenticate(new_password)).to be_truthy
    expect(StaffSession.for_token(old)).not_to exist
    expect(response.body).not_to include(new_password)
    get "/api/v1/staff/current", as: :json
    expect(response).to have_http_status(:unauthorized)
  end

  it "現在のパスワードが違う場合は変更しない" do
    patch "/api/v1/staff/password", params: { staff: { current_password: "wrong", password: new_password, password_confirmation: new_password } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(login_staff.reload.authenticate(login_password)).to be_truthy
  end

  it "非ownerは別担当者のパスワードを再設定できない" do
    target = create(:staff)
    patch "/api/v1/staff_masters/#{target.staff_master_id}/password", params: { staff_master: { lock_version: 0 }, staff: { current_password: login_password, password: new_password, password_confirmation: new_password } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:forbidden)
    expect(target.reload.authenticate(new_password)).to be(false)
  end

  it "ownerの再設定は対象の全セッションを失効し操作を記録する" do
    login_staff.staff_master.update!(role_code: "owner")
    login!
    target = create(:staff)
    old = StaffSession.issue!(target)
    patch "/api/v1/staff_masters/#{target.staff_master_id}/password", params: { staff_master: { lock_version: target.staff_master.lock_version }, staff: { current_password: login_password, password: new_password, password_confirmation: new_password } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:ok)
    expect(target.reload.authenticate(new_password)).to be_truthy
    expect(StaffSession.for_token(old)).not_to exist
    expect(SecurityAuditEvent.last.action).to eq("password_reset")
    expect(SecurityAuditEvent.last.actor_id).to eq(login_staff.id)
  end
  it "短いパスワード・確認不一致を拒否しセッションを維持する" do
    patch "/api/v1/staff/password", params: { staff: { current_password: login_password, password: "short", password_confirmation: "different" } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:unprocessable_content)
    expect(login_staff.reload.authenticate(login_password)).to be_truthy
    get "/api/v1/staff/current"
    expect(response).to have_http_status(:ok)
  end

  it "ownerでも古い版で再設定できない" do
    login_staff.staff_master.update!(role_code: "owner")
    login!
    target = create(:staff)
    target.staff_master.update!(memo: "先行変更")
    patch "/api/v1/staff_masters/#{target.staff_master_id}/password", params: { staff_master: { lock_version: 0 }, staff: { current_password: login_password, password: new_password, password_confirmation: new_password } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:conflict)
    expect(target.reload.authenticate(new_password)).to be(false)
  end
end
