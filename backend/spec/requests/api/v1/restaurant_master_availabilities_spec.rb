require "rails_helper"

RSpec.describe "Api::V1::RestaurantMasterAvailabilities",
                type: :request do
  let!(:staff) do
    create(:staff)
  end

  let!(:restaurant_master_type_master) do
    create(
      :standard_master,
      system_key: "restaurant_master_type"
    )
  end

  let!(:table_type) do
    create(
      :standard_list_master,
      standard_master: restaurant_master_type_master,
      label: "テーブル席"
    )
  end

  let!(:reservation_status_master) do
    create(
      :standard_master,
      system_key: "reservation_status"
    )
  end

  let!(:confirmed_status) do
    create(
      :standard_list_master,
      standard_master: reservation_status_master,
      label: "予約確定"
    )
  end

  let!(:restaurant_master) do
    create(
      :restaurant_master,
      restaurant_master_type: table_type,
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  let(:reservation_date) do
    Time.zone.local(2026, 8, 20, 18, 0)
  end

  before do
    login_as_staff(staff)
    get "/api/v1/staff/current"
  end

  describe "GET /api/v1/restaurant_master_availabilities" do
    context "指定時間帯と重複する予約が存在する場合" do
      let!(:reservation) do
        create(
          :reservation,
          starts_at: reservation_date,
          ends_at: reservation_date + 2.hours,
          requested_restaurant_master_type: table_type,
          reservation_status: confirmed_status,
          created_by_staff: staff,
          updated_by_staff: staff
        )
      end

      before do
        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )
      end

      it "使用できない実テーブルIDを返す" do
        get "/api/v1/restaurant_master_availabilities",
            params: {
              starts_at: (reservation_date + 30.minutes).iso8601,
              ends_at: (reservation_date + 90.minutes).iso8601
            }

        expect(response).to have_http_status(:ok)

        expect(
          response.parsed_body.dig(
            "data",
            "unavailable_restaurant_master_ids"
          )
        ).to eq([ restaurant_master.id ])
      end
    end

    context "指定時間帯と重複する予約が存在しない場合" do
      it "空配列を返す" do
        get "/api/v1/restaurant_master_availabilities",
            params: {
              starts_at: reservation_date.iso8601,
              ends_at: (reservation_date + 2.hours).iso8601
            }

        expect(response).to have_http_status(:ok)

        expect(
          response.parsed_body.dig(
            "data",
            "unavailable_restaurant_master_ids"
          )
        ).to eq([])
      end
    end

    context "reservation_idを指定した場合" do
      let!(:reservation) do
        create(
          :reservation,
          starts_at: reservation_date,
          ends_at: reservation_date + 2.hours,
          requested_restaurant_master_type: table_type,
          reservation_status: confirmed_status,
          created_by_staff: staff,
          updated_by_staff: staff
        )
      end

      before do
        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )
      end

      it "指定した予約自身を重複判定から除外する" do
        get "/api/v1/restaurant_master_availabilities",
            params: {
              starts_at: reservation_date.iso8601,
              ends_at: (reservation_date + 2.hours).iso8601,
              reservation_id: reservation.id
            }

        expect(response).to have_http_status(:ok)

        expect(
          response.parsed_body.dig(
            "data",
            "unavailable_restaurant_master_ids"
          )
        ).to eq([])
      end
    end

    context "終了日時が開始日時以前の場合" do
      it "400を返す" do
        get "/api/v1/restaurant_master_availabilities",
            params: {
              starts_at: reservation_date.iso8601,
              ends_at: reservation_date.iso8601
            }

        expect(response).to have_http_status(:bad_request)

        expect(
          response.parsed_body["message"]
        ).to eq(
          "終了日時は開始日時より後に指定してください"
        )
      end
    end

    context "日時形式が不正な場合" do
      it "400を返す" do
        get "/api/v1/restaurant_master_availabilities",
            params: {
              starts_at: "invalid-datetime",
              ends_at: (reservation_date + 2.hours).iso8601
            }

        expect(response).to have_http_status(:bad_request)

        expect(
          response.parsed_body["message"]
        ).to eq("日時の形式が正しくありません")
      end
    end

    context "必須パラメータが不足している場合" do
      it "400を返す" do
        get "/api/v1/restaurant_master_availabilities",
            params: {
              starts_at: reservation_date.iso8601
            }

        expect(response).to have_http_status(:bad_request)

        expect(
          response.parsed_body["message"]
        ).to eq("リクエストパラメータが不正です")
      end
    end
  end

  def login_as_staff(staff)
    post "/api/v1/staff/login", params: {
      staff: {
        staff_id: staff.id,
        password: "Password123!"
      }
    },
    headers: csrf_headers
  end

  def csrf_headers
    get "/api/v1/csrf"

    json = JSON.parse(response.body)

    token =
      json.dig("data", "csrf_token") ||
      json.dig("data", "token") ||
      json["csrf_token"] ||
      json["token"]

    {
      "X-CSRF-Token" => token
    }
  end
end
