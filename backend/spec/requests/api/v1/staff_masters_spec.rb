require "rails_helper"

RSpec.describe "Api::V1::StaffMasters", type: :request do
  let(:login_password) { "Password123!" }

  let!(:login_staff_master) do
    create(
      :staff_master,
      code: "STF900",
      name: "管理者",
      role_code: "owner",
      employment_started_on: Date.new(2026, 1, 1)
    )
  end

  let!(:login_staff) do
    create(
      :staff,
      staff_master: login_staff_master,
      password: login_password,
      password_confirmation: login_password,
      login_enabled: true,
      failed_attempts: 0,
      locked_at: nil
    )
  end

  def response_body
    JSON.parse(response.body)
  end

  def fetch_csrf_token
    get "/api/v1/csrf", as: :json

    expect(response).to have_http_status(:ok), response.body

    body = response_body

    token =
      body.dig("data", "csrf_token") ||
      body["csrf_token"]

    expect(token).to be_present, response.body

    token
  end

  def csrf_headers(token)
    {
      "X-CSRF-Token" => token
    }
  end

  def authenticated_headers
    csrf_headers(@authenticated_csrf_token)
  end

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

    @authenticated_csrf_token = fetch_csrf_token
  end

  describe "認証" do
    it "未ログインの場合は401を返す" do
      get "/api/v1/staff_masters", as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"]).to eq("ログインが必要です")
    end
  end

  describe "GET /api/v1/staff_masters" do
    before do
      login!
    end

    let!(:first_staff_master) do
      create(
        :staff_master,
        code: "STF001",
        name: "担当者A",
        role_code: "operator",
        employment_started_on: Date.new(2026, 2, 1)
      )
    end

    let!(:first_staff) do
      create(
        :staff,
        staff_master: first_staff_master,
        password: "Password123!",
        password_confirmation: "Password123!",
        login_enabled: true
      )
    end

    let!(:second_staff_master) do
      create(
        :staff_master,
        code: "STF002",
        name: "担当者B",
        role_code: "viewer",
        employment_started_on: Date.new(2026, 3, 1)
      )
    end

    it "担当者一覧を取得できる" do
      get "/api/v1/staff_masters", as: :json

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")

      staff_masters = response_body.dig("data", "staff_masters")

      expect(staff_masters).to be_an(Array)

      codes = staff_masters.map { |staff_master| staff_master["code"] }

      expect(codes).to include(
        login_staff_master.code,
        first_staff_master.code,
        second_staff_master.code
      )
    end

    it "ID順で取得される" do
      get "/api/v1/staff_masters", as: :json

      ids = response_body
            .dig("data", "staff_masters")
            .map { |staff_master| staff_master["id"] }

      expect(ids).to eq(ids.sort)
    end
  end

  describe "GET /api/v1/staff_masters/:id" do
    before do
      login!
    end

    let!(:target_staff_master) do
      create(
        :staff_master,
        code: "STF010",
        name: "詳細確認担当者",
        role_code: "operator",
        employment_started_on: Date.new(2026, 4, 1),
        memo: "詳細確認用"
      )
    end

    let!(:target_staff) do
      create(
        :staff,
        staff_master: target_staff_master,
        password: "Password123!",
        password_confirmation: "Password123!"
      )
    end

    it "指定した担当者を取得できる" do
      get(
        "/api/v1/staff_masters/#{target_staff_master.id}",
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")

      staff_master = response_body.dig("data", "staff_master")

      expect(staff_master["id"]).to eq(target_staff_master.id)
      expect(staff_master["code"]).to eq("STF010")
      expect(staff_master["name"]).to eq("詳細確認担当者")
      expect(staff_master["role_code"]).to eq("operator")
      expect(staff_master["memo"]).to eq("詳細確認用")
    end

    it "存在しないIDの場合は404を返す" do
      get "/api/v1/staff_masters/999999", as: :json

      expect(response).to have_http_status(:not_found)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"]).to eq("データが見つかりませんでした")
    end
  end

  describe "POST /api/v1/staff_masters" do
    before do
      login!
    end

    let(:valid_params) do
      {
        staff_master: {
          code: "STF100",
          name: "新規担当者",
          role_code: "operator",
          employment_started_on: "2026-06-01",
          memo: "新規登録テスト"
        },
        staff: {
          password: "Password123!",
          password_confirmation: "Password123!",
          login_enabled: true
        }
      }
    end

    it "StaffMasterとStaffを同時に登録できる" do
      expect do
        post(
          "/api/v1/staff_masters",
          params: valid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.to change(StaffMaster, :count).by(1)
        .and change(Staff, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response_body["status"]).to eq("success")

      created_staff_master = StaffMaster.find_by!(code: "STF100")
      created_staff = created_staff_master.staff

      expect(created_staff_master.name).to eq("新規担当者")
      expect(created_staff_master.role_code).to eq("operator")
      expect(created_staff_master.memo).to eq("新規登録テスト")

      expect(created_staff).to be_present
      expect(created_staff.login_enabled).to be(true)
      expect(created_staff.authenticate("Password123!")).to be_truthy
    end

    it "Staff作成に失敗した場合はStaffMasterもロールバックされる" do
      invalid_params = valid_params.deep_merge(
        staff: {
          password: "Password123!",
          password_confirmation: "DifferentPassword!",
          login_enabled: true
        }
      )

      expect do
        post(
          "/api/v1/staff_masters",
          params: invalid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(StaffMaster, :count)

      expect(Staff.find_by(staff_master: StaffMaster.find_by(code: "STF100")))
        .to be_nil

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
    end

    it "無効な権限の場合は422を返す" do
      invalid_params = valid_params.deep_merge(
        staff_master: {
          role_code: "administrator"
        }
      )

      expect do
        post(
          "/api/v1/staff_masters",
          params: invalid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(StaffMaster, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
      expect(response_body["errors"]).to be_present
    end

    it "staffパラメータがない場合は400を返し登録しない" do
      params_without_staff = {
        staff_master: valid_params[:staff_master]
      }

      expect do
        post(
          "/api/v1/staff_masters",
          params: params_without_staff,
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(StaffMaster, :count)

      expect(response).to have_http_status(:bad_request)
      expect(response_body["status"]).to eq("error")
    end
  end

  describe "PATCH /api/v1/staff_masters/:id" do
    before do
      login!
    end

    let(:retired_on) { Date.current }

    let!(:target_staff_master) do
      create(
        :staff_master,
        code: "STF200",
        name: "更新前担当者",
        role_code: "operator",
        employment_started_on: Date.new(2026, 1, 1),
        memo: nil
      )
    end

    it "担当者基本情報を更新できる" do
      patch(
        "/api/v1/staff_masters/#{target_staff_master.id}",
        params: {
          staff_master: {
            code: "STF200",
            name: "更新後担当者",
            role_code: "viewer",
            employment_started_on: "2026-01-01",
            memo: "更新済み"
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")

      target_staff_master.reload

      expect(target_staff_master.name).to eq("更新後担当者")
      expect(target_staff_master.role_code).to eq("viewer")
      expect(target_staff_master.memo).to eq("更新済み")
    end

    it "無効な権限の場合は更新せず422を返す" do
      patch(
        "/api/v1/staff_masters/#{target_staff_master.id}",
        params: {
          staff_master: {
            role_code: "invalid_role"
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")

      expect(target_staff_master.reload.role_code).to eq("operator")
    end
  end

  describe "PATCH /api/v1/staff_masters/:id/retire" do
    before do
      login!
    end

    let(:retired_on) { Date.current }

    let!(:target_staff_master) do
      create(
        :staff_master,
        code: "STF300",
        role_code: "operator",
        employment_started_on: Date.new(2026, 1, 1),
        retired_on: nil
      )
    end

    it "担当者を退職扱いにできる" do
      patch(
        "/api/v1/staff_masters/#{target_staff_master.id}/retire",
        params: {
          staff_master:{
          retired_on: retired_on.iso8601
        }
      },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok), response.body
      expect(response_body["status"]).to eq("success")
      expect(target_staff_master.reload.retired_on).to eq(retired_on)
      expect(target_staff_master).to be_retired
    end

    it "すでに退職済みの場合は422を返す" do
      target_staff_master.update!(retired_on: Date.current)

      patch(
        "/api/v1/staff_masters/#{target_staff_master.id}/retire",
        params: {
          staff_master: {
            retired_on: retired_on.iso8601
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
    end
  end

  describe "PATCH /api/v1/staff_masters/:id/restore" do
    before do
      login!
    end

    let!(:target_staff_master) do
      create(
        :staff_master,
        code: "STF400",
        role_code: "operator",
        employment_started_on: Date.new(2026, 1, 1),
        retired_on: Date.new(2026, 6, 1)
      )
    end

    it "退職済み担当者を復帰できる" do
      patch(
        "/api/v1/staff_masters/#{target_staff_master.id}/restore",
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")
      expect(target_staff_master.reload.retired_on).to be_nil
      expect(target_staff_master).to be_active
    end

    it "すでに在籍中の場合は422を返す" do
      target_staff_master.update!(retired_on: nil)

      patch(
        "/api/v1/staff_masters/#{target_staff_master.id}/restore",
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
    end
  end

  describe "PATCH /api/v1/staff_masters/:id/login_enabled" do
    before do
      login!
    end

    let!(:target_staff_master) do
      create(
        :staff_master,
        code: "STF500",
        role_code: "operator"
      )
    end

    let!(:target_staff) do
      create(
        :staff,
        staff_master: target_staff_master,
        password: "Password123!",
        password_confirmation: "Password123!",
        login_enabled: true
      )
    end

    it "ログイン可否を変更できる" do
      patch(
        "/api/v1/staff_masters/#{target_staff_master.id}/login_enabled",
        params: {
          staff: {
            login_enabled: false
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")
      expect(target_staff.reload.login_enabled).to be(false)
    end

    it "関連するStaffがない場合は422を返す" do
      staff_master_without_staff = create(
        :staff_master,
        code: "STF501"
      )

      patch(
        "/api/v1/staff_masters/#{staff_master_without_staff.id}/login_enabled",
        params: {
          staff: {
            login_enabled: false
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
    end
  end

  describe "PATCH /api/v1/staff_masters/:id/reset_failed_attempts" do
    before do
      login!
    end

    let!(:target_staff_master) do
      create(
        :staff_master,
        code: "STF600",
        role_code: "operator"
      )
    end

    let!(:target_staff) do
      create(
        :staff,
        staff_master: target_staff_master,
        password: "Password123!",
        password_confirmation: "Password123!",
        failed_attempts: 30,
        locked_at: Time.current
      )
    end

    it "失敗回数とロック状態をリセットできる" do
      patch(
        "/api/v1/staff_masters/#{target_staff_master.id}/reset_failed_attempts",
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")

      target_staff.reload

      expect(target_staff.failed_attempts).to eq(0)
      expect(target_staff.locked_at).to be_nil
      expect(target_staff).not_to be_locked
    end

    it "関連するStaffがない場合は422を返す" do
      staff_master_without_staff = create(
        :staff_master,
        code: "STF601"
      )

      patch(
        "/api/v1/staff_masters/#{staff_master_without_staff.id}/reset_failed_attempts",
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
    end
  end
end