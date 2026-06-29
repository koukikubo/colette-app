require "rails_helper"

RSpec.describe "Api::V1::RestaurantMasters", type: :request do
  let(:login_password) { "Password123!" }

  let!(:login_staff_master) do
    create(
      :staff_master,
      code: "STF950",
      name: "席マスタ担当者",
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

  # 予約席種の親マスタ
  let!(:restaurant_master_type_master) do
    create(
      :standard_master,
      system_key: "restaurant_master_type",
      name: "予約席種",
      active: true,
      position: 1
    )
  end

  # テーブル席
  let!(:table_type) do
    create(
      :standard_list_master,
      standard_master: restaurant_master_type_master,
      code: "T",
      label: "テーブル席",
      active: true,
      position: 1
    )
  end

  # カウンター席
  let!(:counter_type) do
    create(
      :standard_list_master,
      standard_master: restaurant_master_type_master,
      code: "C",
      label: "カウンター席",
      active: true,
      position: 2
    )
  end

  def response_body
    JSON.parse(response.body)
  end

  def fetch_csrf_token
    get "/api/v1/csrf"

    expect(response).to have_http_status(:ok),
                        response.body

    token =
      response_body.dig("data", "csrf_token") ||
      response_body["csrf_token"]

    expect(token).to be_present,
                  response.body

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

    expect(response).to have_http_status(:ok),
                        response.body

    # ログイン時にreset_sessionされるため、
    # ログイン後のセッション用CSRFトークンを再取得する。
    @authenticated_csrf_token =
      fetch_csrf_token
  end

  def create_restaurant_master!(
    type: table_type,
    sequence_number:,
    code:,
    name:,
    position:,
    created_by_staff: other_staff,
    updated_by_staff: other_staff,
    capacity: 4,
    active: true,
    memo: nil
  )
    create(
      :restaurant_master,
      restaurant_master_type: type,
      sequence_number: sequence_number,
      code: code,
      name: name,
      capacity: capacity,
      active: active,
      position: position,
      memo: memo,
      created_by_staff: created_by_staff,
      updated_by_staff: updated_by_staff
    )
  end

  describe "認証" do
    it "未ログインの場合は401を返す" do
      get "/api/v1/restaurant_masters"

      expect(response)
        .to have_http_status(:unauthorized)

      expect(response_body["status"])
        .to eq("error")

      expect(response_body["message"])
        .to eq("ログインが必要です")
    end
  end

  describe "GET /api/v1/restaurant_masters" do
    before do
      login!
    end

    let!(:first_table) do
      create_restaurant_master!(
        sequence_number: 1,
        code: "T01",
        name: "テーブル1",
        position: 10
      )
    end

    let!(:second_table) do
      create_restaurant_master!(
        sequence_number: 2,
        code: "T02",
        name: "テーブル2",
        position: 10
      )
    end

    let!(:third_table) do
      create_restaurant_master!(
        type: counter_type,
        sequence_number: 1,
        code: "C01",
        name: "カウンター1",
        position: 20
      )
    end

    it "席一覧を取得できる" do
      get "/api/v1/restaurant_masters"

      expect(response)
        .to have_http_status(:ok)

      expect(response_body["status"])
        .to eq("success")

      restaurant_masters =
        response_body.dig(
          "data",
          "restaurant_masters"
        )

      expect(restaurant_masters.length)
        .to eq(3)
    end

    it "positionとIDの昇順で取得する" do
      get "/api/v1/restaurant_masters"

      ids =
        response_body
          .dig("data", "restaurant_masters")
          .map { |restaurant_master|
            restaurant_master["id"]
          }

      expect(ids).to eq(
        [
          first_table.id,
          second_table.id,
          third_table.id
        ]
      )
    end

    it "席種と担当者情報を取得できる" do
      get "/api/v1/restaurant_masters"

      restaurant_master =
        response_body
          .dig("data", "restaurant_masters")
          .find { |item|
            item["id"] == first_table.id
          }

      expect(
        restaurant_master["restaurant_master_type_id"]
      ).to eq(table_type.id)

      expect(
        restaurant_master.dig(
          "restaurant_master_type",
          "code"
        )
      ).to eq("T")

      expect(
        restaurant_master.dig(
          "restaurant_master_type",
          "label"
        )
      ).to eq("テーブル席")

      expect(
        restaurant_master.dig(
          "created_by_staff",
          "id"
        )
      ).to eq(other_staff.id)

      expect(
        restaurant_master.dig(
          "updated_by_staff",
          "id"
        )
      ).to eq(other_staff.id)

      expect(restaurant_master["lock_version"])
        .to eq(first_table.lock_version)
    end
  end

  describe "GET /api/v1/restaurant_masters/:id" do
    before do
      login!
    end

    let!(:restaurant_master) do
      create_restaurant_master!(
        sequence_number: 1,
        code: "T01",
        name: "詳細確認テーブル",
        position: 1,
        memo: "詳細確認用"
      )
    end

    it "指定した席を取得できる" do
      get(
        "/api/v1/restaurant_masters/" \
        "#{restaurant_master.id}"
      )

      expect(response)
        .to have_http_status(:ok)

      expect(response_body["status"])
        .to eq("success")

      response_restaurant_master =
        response_body.dig(
          "data",
          "restaurant_master"
        )

      expect(response_restaurant_master["id"])
        .to eq(restaurant_master.id)

      expect(response_restaurant_master["code"])
        .to eq("T01")

      expect(response_restaurant_master["name"])
        .to eq("詳細確認テーブル")

      expect(response_restaurant_master["capacity"])
        .to eq(4)

      expect(response_restaurant_master["memo"])
        .to eq("詳細確認用")
    end

    it "存在しないIDの場合は404を返す" do
      get "/api/v1/restaurant_masters/999999"

      expect(response)
        .to have_http_status(:not_found)

      expect(response_body["status"])
        .to eq("error")

      expect(response_body["message"])
        .to eq("データが見つかりませんでした")
    end
  end

  describe "POST /api/v1/restaurant_masters" do
    before do
      login!
    end

    let(:valid_params) do
      {
        restaurant_master: {
          restaurant_master_type_id: table_type.id,
          name: " 窓側テーブル ",
          capacity: 4,
          active: true,
          position: 1,
          memo: " 窓側の席 "
        }
      }
    end

    it "席を登録できる" do
      expect do
        post(
          "/api/v1/restaurant_masters",
          params: valid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.to change(RestaurantMaster, :count).by(1)

      expect(response)
        .to have_http_status(:created)

      expect(response_body["status"])
        .to eq("success")

      restaurant_master =
        RestaurantMaster.order(:id).last

      expect(restaurant_master.name)
        .to eq("窓側テーブル")

      expect(restaurant_master.capacity)
        .to eq(4)

      expect(restaurant_master.memo)
        .to eq("窓側の席")
    end

    it "テーブル席の1件目にT01を採番する" do
      post(
        "/api/v1/restaurant_masters",
        params: valid_params,
        headers: authenticated_headers,
        as: :json
      )

      restaurant_master =
        RestaurantMaster.order(:id).last

      expect(restaurant_master.code)
        .to eq("T01")

      expect(restaurant_master.sequence_number)
        .to eq(1)
    end

    it "テーブル席の2件目にT02を採番する" do
      create_restaurant_master!(
        sequence_number: 1,
        code: "T01",
        name: "既存テーブル",
        position: 2
      )

      post(
        "/api/v1/restaurant_masters",
        params: valid_params,
        headers: authenticated_headers,
        as: :json
      )

      restaurant_master =
        RestaurantMaster.order(:id).last

      expect(restaurant_master.code)
        .to eq("T02")

      expect(restaurant_master.sequence_number)
        .to eq(2)
    end

    it "席種ごとに連番を分けて採番する" do
      create_restaurant_master!(
        sequence_number: 1,
        code: "T01",
        name: "既存テーブル",
        position: 1
      )

      counter_params =
        valid_params.deep_merge(
          restaurant_master: {
            restaurant_master_type_id:
              counter_type.id,
            name: "カウンター1"
          }
        )

      post(
        "/api/v1/restaurant_masters",
        params: counter_params,
        headers: authenticated_headers,
        as: :json
      )

      restaurant_master =
        RestaurantMaster.order(:id).last

      expect(restaurant_master.code)
        .to eq("C01")

      expect(restaurant_master.sequence_number)
        .to eq(1)
    end

    it "認証中の担当者を作成者と更新者に設定する" do
      post(
        "/api/v1/restaurant_masters",
        params: valid_params,
        headers: authenticated_headers,
        as: :json
      )

      restaurant_master =
        RestaurantMaster.order(:id).last

      expect(restaurant_master.created_by_staff)
        .to eq(login_staff)

      expect(restaurant_master.updated_by_staff)
        .to eq(login_staff)
    end

    it "クライアントから送られた自動生成項目を採用しない" do
      spoofed_params =
        valid_params.deep_merge(
          restaurant_master: {
            code: "X99",
            sequence_number: 99,
            created_by_staff_id: other_staff.id,
            updated_by_staff_id: other_staff.id
          }
        )

      post(
        "/api/v1/restaurant_masters",
        params: spoofed_params,
        headers: authenticated_headers,
        as: :json
      )

      expect(response)
        .to have_http_status(:created)

      restaurant_master =
        RestaurantMaster.order(:id).last

      expect(restaurant_master.code)
        .to eq("T01")

      expect(restaurant_master.sequence_number)
        .to eq(1)

      expect(restaurant_master.created_by_staff)
        .to eq(login_staff)

      expect(restaurant_master.updated_by_staff)
        .to eq(login_staff)
    end

    it "席種IDがない場合は400を返す" do
      invalid_params =
        valid_params.deep_merge(
          restaurant_master: {
            restaurant_master_type_id: nil
          }
        )

      expect do
        post(
          "/api/v1/restaurant_masters",
          params: invalid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(RestaurantMaster, :count)

      expect(response)
        .to have_http_status(:bad_request)

      expect(response_body["status"])
        .to eq("error")
    end

    it "存在しない席種の場合は404を返す" do
      invalid_params =
        valid_params.deep_merge(
          restaurant_master: {
            restaurant_master_type_id: 999999
          }
        )

      expect do
        post(
          "/api/v1/restaurant_masters",
          params: invalid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(RestaurantMaster, :count)

      expect(response)
        .to have_http_status(:not_found)

      expect(response_body["status"])
        .to eq("error")
    end

    it "別の基本コード配下の選択肢は使用できない" do
      reservation_route_master =
        create(
          :standard_master,
          system_key: "reservation_route",
          name: "予約経路",
          active: true,
          position: 2
        )

      reservation_route =
        create(
          :standard_list_master,
          standard_master:
            reservation_route_master,
          code: "TEL",
          label: "電話",
          active: true
        )

      invalid_params =
        valid_params.deep_merge(
          restaurant_master: {
            restaurant_master_type_id:
              reservation_route.id
          }
        )

      expect do
        post(
          "/api/v1/restaurant_masters",
          params: invalid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(RestaurantMaster, :count)

      expect(response)
        .to have_http_status(:not_found)
    end

    it "無効な席種は使用できない" do
      inactive_type =
        create(
          :standard_list_master,
          standard_master:
            restaurant_master_type_master,
          code: "Z",
          label: "無効席種",
          active: false,
          position: 3
        )

      # ① Factoryで本当にfalseとして保存されたか
      expect(inactive_type.reload.active)
        .to be(false)

      invalid_params =
        valid_params.deep_merge(
          restaurant_master: {
            restaurant_master_type_id:
              inactive_type.id
          }
        )

      # ② リクエストに無効席種のIDが入っているか
      expect(
        invalid_params.dig(
          :restaurant_master,
          :restaurant_master_type_id
        )
      ).to eq(inactive_type.id)

      # ③ Serviceと同じ条件で無効席種が除外されるか
      selectable_type_ids =
        StandardListMaster
          .joins(:standard_master)
          .where(
            standard_list_masters: {
              active: true
            }
          )
          .where(
            standard_masters: {
              system_key: "restaurant_master_type",
              active: true
            }
          )
          .pluck(:id)

      expect(selectable_type_ids)
        .not_to include(inactive_type.id)

      expect do
        post(
          "/api/v1/restaurant_masters",
          params: invalid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(RestaurantMaster, :count)

      expect(response)
        .to have_http_status(:not_found)
    end

    it "不正な属性の場合は登録せず422を返す" do
      invalid_params =
        valid_params.deep_merge(
          restaurant_master: {
            name: " ",
            capacity: 0
          }
        )

      expect do
        post(
          "/api/v1/restaurant_masters",
          params: invalid_params,
          headers: authenticated_headers,
          as: :json
        )
      end.not_to change(RestaurantMaster, :count)

      expect(response)
        .to have_http_status(
          :unprocessable_content
        )

      expect(response_body["status"])
        .to eq("error")

      expect(response_body["message"])
        .to eq("入力内容に誤りがあります")

      expect(response_body["errors"])
        .to be_present
    end
  end

  describe "PATCH /api/v1/restaurant_masters/:id" do
    before do
      login!
    end

    let!(:restaurant_master) do
      create_restaurant_master!(
        sequence_number: 1,
        code: "T01",
        name: "更新前テーブル",
        position: 1,
        memo: nil
      )
    end

    it "席情報を更新できる" do
      patch(
        "/api/v1/restaurant_masters/" \
        "#{restaurant_master.id}",
        params: {
          restaurant_master: {
            name: "更新後テーブル",
            capacity: 6,
            active: false,
            position: 20,
            memo: "更新しました",
            lock_version:
              restaurant_master.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response)
        .to have_http_status(:ok)

      expect(response_body["status"])
        .to eq("success")

      restaurant_master.reload

      expect(restaurant_master.name)
        .to eq("更新後テーブル")

      expect(restaurant_master.capacity)
        .to eq(6)

      expect(restaurant_master.active)
        .to be(false)

      expect(restaurant_master.position)
        .to eq(20)

      expect(restaurant_master.memo)
        .to eq("更新しました")

      expect(restaurant_master.updated_by_staff)
        .to eq(login_staff)
    end

    it "席種・コード・連番・作成担当者を変更しない" do
      original_type =
        restaurant_master.restaurant_master_type

      original_code =
        restaurant_master.code

      original_sequence_number =
        restaurant_master.sequence_number

      original_created_by_staff =
        restaurant_master.created_by_staff

      patch(
        "/api/v1/restaurant_masters/" \
        "#{restaurant_master.id}",
        params: {
          restaurant_master: {
            name: "更新後テーブル",
            restaurant_master_type_id:
              counter_type.id,
            code: "C99",
            sequence_number: 99,
            created_by_staff_id:
              login_staff.id,
            updated_by_staff_id:
              other_staff.id,
            lock_version:
              restaurant_master.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response)
        .to have_http_status(:ok)

      restaurant_master.reload

      expect(
        restaurant_master.restaurant_master_type
      ).to eq(original_type)

      expect(restaurant_master.code)
        .to eq(original_code)

      expect(restaurant_master.sequence_number)
        .to eq(original_sequence_number)

      expect(restaurant_master.created_by_staff)
        .to eq(original_created_by_staff)

      expect(restaurant_master.updated_by_staff)
        .to eq(login_staff)
    end

    it "不正な属性の場合は更新せず422を返す" do
      patch(
        "/api/v1/restaurant_masters/" \
        "#{restaurant_master.id}",
        params: {
          restaurant_master: {
            capacity: 0,
            lock_version:
              restaurant_master.lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response)
        .to have_http_status(
          :unprocessable_content
        )

      expect(response_body["status"])
        .to eq("error")

      expect(restaurant_master.reload.capacity)
        .to eq(4)
    end

    it "lock_versionがない場合は400を返す" do
      patch(
        "/api/v1/restaurant_masters/" \
        "#{restaurant_master.id}",
        params: {
          restaurant_master: {
            name: "更新後テーブル"
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response)
        .to have_http_status(:bad_request)

      expect(response_body["status"])
        .to eq("error")

      expect(restaurant_master.reload.name)
        .to eq("更新前テーブル")
    end

    it "古いlock_versionの場合は409を返す" do
      stale_lock_version =
        restaurant_master.lock_version

      restaurant_master.update!(
        memo: "別の担当者による更新"
      )

      patch(
        "/api/v1/restaurant_masters/" \
        "#{restaurant_master.id}",
        params: {
          restaurant_master: {
            name: "競合更新",
            lock_version: stale_lock_version
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response)
        .to have_http_status(:conflict)

      expect(response_body["status"])
        .to eq("error")

      expect(response_body["message"])
        .to eq(
          "席情報は別の担当者によって更新されています"
        )

      restaurant_master.reload

      expect(restaurant_master.name)
        .to eq("更新前テーブル")

      expect(restaurant_master.memo)
        .to eq("別の担当者による更新")
    end

    it "存在しないIDの場合は404を返す" do
      patch(
        "/api/v1/restaurant_masters/999999",
        params: {
          restaurant_master: {
            name: "更新後テーブル",
            lock_version: 0
          }
        },
        headers: authenticated_headers,
        as: :json
      )

      expect(response)
        .to have_http_status(:not_found)
    end
  end
end
