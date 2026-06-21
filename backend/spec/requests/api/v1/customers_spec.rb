require "rails_helper"

RSpec.describe "Api::V1::Customers", type: :request do
  let(:login_password) { "Password123!" }

  let!(:login_staff_master) do
    create(
      :staff_master,
      code: "STF900",
      name: "顧客管理担当者",
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

  let!(:other_staff) do
    create(:staff)
  end

  def response_body
    JSON.parse(response.body)
  end

  def fetch_csrf_token
    get "/api/v1/csrf"

    expect(response).to have_http_status(:ok), response.body

    token =
      response_body.dig("data", "csrf_token") ||
      response_body["csrf_token"]

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
    )

    expect(response).to have_http_status(:ok), response.body

    # ログイン処理でreset_sessionされるため再取得する
    @authenticated_csrf_token = fetch_csrf_token
  end

  describe "認証" do
    it "未ログインの場合は401を返す" do
      get "/api/v1/customers"

      expect(response).to have_http_status(:unauthorized)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"]).to eq("ログインが必要です")
    end
  end

  describe "GET /api/v1/customers" do
    before do
      login!
    end

    let!(:older_customer) do
      create(
        :customer,
        name: "山田 太郎",
        kana: "ヤマダ タロウ",
        customer_kind: "individual",
        hidden_at: nil
      )
    end

    let!(:newer_customer) do
      create(
        :customer,
        name: "久保 光輝",
        kana: "クボ コウキ",
        customer_kind: "individual",
        hidden_at: nil
      )
    end

    let!(:corporate_customer) do
      create(
        :customer,
        :corporate,
        name: "浅井 一郎",
        kana: "アサイ イチロウ",
        company_name: "株式会社浅井",
        hidden_at: nil
      )
    end

    let!(:hidden_customer) do
      create(
        :customer,
        :hidden,
        name: "非表示 顧客",
        kana: "ヒヒョウジ コキャク"
      )
    end

    it "デフォルトでは表示中の顧客だけを取得する" do
      get "/api/v1/customers"

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")

      customers = response_body.dig("data", "customers")
      customer_ids = customers.map { |customer| customer["id"] }

      expect(customer_ids).to include(
        older_customer.id,
        newer_customer.id,
        corporate_customer.id
      )

      expect(customer_ids).not_to include(hidden_customer.id)
    end

    it "IDの降順で取得する" do
      get "/api/v1/customers"

      customer_ids =
        response_body
          .dig("data", "customers")
          .map { |customer| customer["id"] }

      expect(customer_ids).to eq(customer_ids.sort.reverse)
    end

    it "visibility=hiddenで非表示顧客だけを取得する" do
      get(
        "/api/v1/customers",
        params: { visibility: "hidden" }
      )

      expect(response).to have_http_status(:ok)

      customer_ids =
        response_body
          .dig("data", "customers")
          .map { |customer| customer["id"] }

      expect(customer_ids).to contain_exactly(hidden_customer.id)
    end

    it "visibility=allで表示中と非表示の両方を取得する" do
      get(
        "/api/v1/customers",
        params: { visibility: "all" }
      )

      expect(response).to have_http_status(:ok)

      customer_ids =
        response_body
          .dig("data", "customers")
          .map { |customer| customer["id"] }

      expect(customer_ids).to include(
        older_customer.id,
        newer_customer.id,
        corporate_customer.id,
        hidden_customer.id
      )
    end

    it "customer_kindで法人顧客を絞り込める" do
      get(
        "/api/v1/customers",
        params: { customer_kind: "corporate" }
      )

      expect(response).to have_http_status(:ok)

      customer_ids =
        response_body
          .dig("data", "customers")
          .map { |customer| customer["id"] }

      expect(customer_ids).to contain_exactly(corporate_customer.id)
    end

    it "キーワードで顧客を検索できる" do
      get(
        "/api/v1/customers",
        params: { query: "株式会社浅井" },
      )

      expect(response).to have_http_status(:ok)

      customer_ids =
        response_body
          .dig("data", "customers")
          .map { |customer| customer["id"] }

      expect(customer_ids).to contain_exactly(corporate_customer.id)
    end

    it "不正なvisibilityの場合は400を返す" do
      get(
        "/api/v1/customers",
        params: { visibility: "invalid" },
      )

      expect(response).to have_http_status(:bad_request)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"]).to eq("表示条件が不正です")
    end

    it "不正なcustomer_kindの場合は400を返す" do
      get(
        "/api/v1/customers",
        params: { customer_kind: "invalid" },
      )

      expect(response).to have_http_status(:bad_request)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"]).to eq("顧客区分が不正です")
    end
  end

  describe "GET /api/v1/customers/:id" do
    before do
      login!
    end

    let!(:customer) do
      create(
        :customer,
        name: "詳細確認 顧客",
        kana: "ショウサイカクニン コキャク",
        created_by_staff: other_staff,
        updated_by_staff: other_staff
      )
    end

    it "指定した顧客を取得できる" do
      get "/api/v1/customers/#{customer.id}"

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")

      response_customer =
        response_body.dig("data", "customer")

      expect(response_customer["id"]).to eq(customer.id)
      expect(response_customer["name"]).to eq("詳細確認 顧客")
      expect(response_customer["kana"])
        .to eq("ショウサイカクニン コキャク")
      expect(response_customer["hidden"]).to be(false)
      expect(response_customer["lock_version"])
        .to eq(customer.lock_version)
    end

    it "登録担当者と更新担当者を取得できる" do
      get "/api/v1/customers/#{customer.id}"

      response_customer =
        response_body.dig("data", "customer")

      expect(
        response_customer.dig("created_by_staff", "id")
      ).to eq(other_staff.id)

      expect(
        response_customer.dig("updated_by_staff", "id")
      ).to eq(other_staff.id)
    end

    it "存在しないIDの場合は404を返す" do
      get "/api/v1/customers/999999"

      expect(response).to have_http_status(:not_found)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"])
        .to eq("データが見つかりませんでした")
    end
  end

  describe "POST /api/v1/customers" do
    before do
      login!
    end

    let(:valid_params) do
      {
        customer: {
          customer_kind: "individual",
          name: " 新規 顧客 ",
          kana: " シンキ コキャク ",
          postal_code: "530-0001",
          address: "大阪府大阪市北区梅田1-1-1",
          phone_number: "090-1234-5678",
          email: "NEW-CUSTOMER@EXAMPLE.COM",
          birthday: "1990-01-01",
          memo: "新規登録テスト"
        }
      }
    end

    it "顧客を登録できる" do
      expect do
        post(
          "/api/v1/customers",
          params: valid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.to change(Customer, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response_body["status"]).to eq("success")

      customer = Customer.order(:id).last

      expect(customer.name).to eq("新規 顧客")
      expect(customer.kana).to eq("シンキ コキャク")
      expect(customer.postal_code).to eq("5300001")
      expect(customer.phone_number).to eq("09012345678")
      expect(customer.email).to eq("new-customer@example.com")
    end

    it "認証中の担当者を登録担当者と更新担当者に設定する" do
      post(
        "/api/v1/customers",
        params: valid_params,
        headers: authenticated_headers,
        as: :json
      )

      customer = Customer.order(:id).last

      expect(customer.created_by_staff).to eq(login_staff)
      expect(customer.updated_by_staff).to eq(login_staff)
    end

    it "クライアントから送信された担当者IDを採用しない" do
      spoofed_params = valid_params.deep_merge(
        customer: {
          created_by_staff_id: other_staff.id,
          updated_by_staff_id: other_staff.id
        }
      )

      post(
        "/api/v1/customers",
        params: spoofed_params,
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:created)

      customer = Customer.order(:id).last

      expect(customer.created_by_staff).to eq(login_staff)
      expect(customer.updated_by_staff).to eq(login_staff)
    end

    it "不正な属性の場合は登録せず422を返す" do
      invalid_params = valid_params.deep_merge(
        customer: {
          kana: "しんき こきゃく"
        }
      )

      expect do
        post(
          "/api/v1/customers",
          params: invalid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(Customer, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
      expect(response_body["errors"]).to be_present
    end

    it "customerパラメータがない場合は400を返す" do
      expect do
        post(
          "/api/v1/customers",
          params: {
            name: "不正なリクエスト"
          },
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(Customer, :count)

      expect(response).to have_http_status(:bad_request)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"])
        .to eq("リクエストパラメータが不正です")
    end
  end

  describe "PATCH /api/v1/customers/:id" do
    before do
      login!
    end

    let!(:customer) do
      create(
        :customer,
        name: "更新前 顧客",
        kana: "コウシンマエ コキャク",
        created_by_staff: other_staff,
        updated_by_staff: other_staff,
        memo: nil,
        hidden_at: nil
      )
    end

    it "顧客情報を更新できる" do
      patch(
        "/api/v1/customers/#{customer.id}",
        params: {
          customer: {
            name: "更新後 顧客",
            kana: "コウシンゴ コキャク",
            memo: "更新しました",
            lock_version: customer.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")

      customer.reload

      expect(customer.name).to eq("更新後 顧客")
      expect(customer.kana).to eq("コウシンゴ コキャク")
      expect(customer.memo).to eq("更新しました")
      expect(customer.updated_by_staff).to eq(login_staff)
    end

    it "登録担当者は変更しない" do
      original_created_by_staff = customer.created_by_staff

      patch(
        "/api/v1/customers/#{customer.id}",
        params: {
          customer: {
            name: "更新後 顧客",
            lock_version: customer.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(customer.reload.created_by_staff)
        .to eq(original_created_by_staff)
    end

    it "送信された担当者IDとhidden_atを採用しない" do
      patch(
        "/api/v1/customers/#{customer.id}",
        params: {
          customer: {
            name: "更新後 顧客",
            created_by_staff_id: login_staff.id,
            updated_by_staff_id: other_staff.id,
            hidden_at: Time.current,
            lock_version: customer.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)

      customer.reload

      expect(customer.created_by_staff).to eq(other_staff)
      expect(customer.updated_by_staff).to eq(login_staff)
      expect(customer.hidden_at).to be_nil
    end

    it "不正な属性の場合は更新せず422を返す" do
      patch(
        "/api/v1/customers/#{customer.id}",
        params: {
          customer: {
            customer_kind: "invalid",
            lock_version: customer.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
      expect(customer.reload.customer_kind).to eq("individual")
    end

    it "lock_versionがない場合は400を返す" do
      patch(
        "/api/v1/customers/#{customer.id}",
        params: {
          customer: {
            name: "更新後 顧客"
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:bad_request)
      expect(response_body["status"]).to eq("error")
      expect(customer.reload.name).to eq("更新前 顧客")
    end

    it "古いlock_versionの場合は409を返す" do
      stale_lock_version = customer.lock_version

      customer.update!(
        memo: "別の担当者による更新"
      )

      patch(
        "/api/v1/customers/#{customer.id}",
        params: {
          customer: {
            name: "競合更新",
            lock_version: stale_lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:conflict)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"])
        .to eq("顧客情報は別の担当者によって更新されています")

      customer.reload

      expect(customer.name).to eq("更新前 顧客")
      expect(customer.memo).to eq("別の担当者による更新")
    end
  end

  describe "PATCH /api/v1/customers/:id/hidden" do
    before do
      login!
    end

    let!(:customer) do
      create(
        :customer,
        hidden_at: nil,
        created_by_staff: other_staff,
        updated_by_staff: other_staff
      )
    end

    it "顧客を非表示にできる" do
      patch(
        "/api/v1/customers/#{customer.id}/hidden",
        params: {
          customer: {
            lock_version: customer.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")

      customer.reload

      expect(customer.hidden_at).to be_present
      expect(customer.updated_by_staff).to eq(login_staff)
    end

    it "すでに非表示の場合は422を返す" do
      customer.update!(hidden_at: Time.current)

      patch(
        "/api/v1/customers/#{customer.id}/hidden",
        params: {
          customer: {
            lock_version: customer.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"])
        .to eq("顧客はすでに非表示です")
    end

    it "lock_versionがない場合は400を返す" do
      patch(
        "/api/v1/customers/#{customer.id}/hidden",
        params: {
          customer: {}
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:bad_request)
      expect(customer.reload.hidden_at).to be_nil
    end
  end

  describe "PATCH /api/v1/customers/:id/restore" do
    before do
      login!
    end

    let!(:customer) do
      create(
        :customer,
        :hidden,
        created_by_staff: other_staff,
        updated_by_staff: other_staff
      )
    end

    it "非表示顧客を復帰できる" do
      patch(
        "/api/v1/customers/#{customer.id}/restore",
        params: {
          customer: {
            lock_version: customer.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:ok)
      expect(response_body["status"]).to eq("success")

      customer.reload

      expect(customer.hidden_at).to be_nil
      expect(customer.updated_by_staff).to eq(login_staff)
    end

    it "すでに表示中の場合は422を返す" do
      customer.update!(hidden_at: nil)

      patch(
        "/api/v1/customers/#{customer.id}/restore",
        params: {
          customer: {
            lock_version: customer.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(response_body["status"]).to eq("error")
      expect(response_body["message"])
        .to eq("顧客はすでに表示中です")
    end

    it "lock_versionがない場合は400を返す" do
      patch(
        "/api/v1/customers/#{customer.id}/restore",
        params: {
          customer: {}
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response).to have_http_status(:bad_request)
      expect(customer.reload.hidden_at).to be_present
    end
  end
end