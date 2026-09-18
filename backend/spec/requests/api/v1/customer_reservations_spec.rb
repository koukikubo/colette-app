require "rails_helper"

RSpec.describe "Api::V1::CustomerReservations", type: :request do
  include_context "authenticated request"

  def reservation_time(date, hour = 18)
    Time.zone.local(
      date.year,
      date.month,
      date.day,
      hour,
      0
    )
  end

  def create_customer_reservation(
    customer:,
    starts_at:,
    status:,
    canceled_at: nil
  )
    Reservation.create!(
      customer: customer,
      reservation_name: customer.name,
      reservation_phone_number: customer.phone_number,
      starts_at: starts_at,
      ends_at: starts_at + 2.hours,
      guest_count: 2,
      requested_restaurant_master_type: table_type,
      reservation_status: status,
      canceled_at: canceled_at,
      created_by_staff: login_staff,
      updated_by_staff: login_staff
    )
  end

  describe "認証" do
    it "未ログインの場合は401を返す" do
      get "/api/v1/customers/1/reservations"

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["status"]).to eq("error")
      expect(response.parsed_body["message"]).to eq("ログインが必要です")
    end
  end

  describe "GET /api/v1/customers/:customer_id/reservations" do
    before do
      login!
    end

    let!(:restaurant_master_type_master) do
      create(
        :standard_master,
        system_key: "restaurant_master_type",
        name: "予約席種"
      )
    end

    let!(:table_type) do
      create(
        :standard_list_master,
        standard_master: restaurant_master_type_master,
        code: "table",
        label: "テーブル席"
      )
    end

    let!(:reservation_status_master) do
      create(
        :standard_master,
        system_key: "reservation_status",
        name: "予約状態"
      )
    end

    let!(:confirmed_status) do
      create(
        :standard_list_master,
        standard_master: reservation_status_master,
        code: "confirmed",
        label: "予約確定"
      )
    end

    let!(:canceled_status) do
      create(
        :standard_list_master,
        standard_master: reservation_status_master,
        code: "canceled",
        label: "取消"
      )
    end

    let!(:customer) do
      create(
        :customer,
        name: "山田 太郎",
        kana: "ヤマダ タロウ",
        phone_number: "09011112222",
        created_by_staff: login_staff,
        updated_by_staff: login_staff
      )
    end

    let!(:other_customer) do
      create(
        :customer,
        name: "佐藤 花子",
        kana: "サトウ ハナコ",
        phone_number: "09033334444",
        created_by_staff: login_staff,
        updated_by_staff: login_staff
      )
    end

    let!(:older_reservation) do
      create_customer_reservation(
        customer: customer,
        starts_at: reservation_time(Time.zone.today - 3.days),
        status: confirmed_status
      )
    end

    let!(:canceled_reservation) do
      create_customer_reservation(
        customer: customer,
        starts_at: reservation_time(Time.zone.today - 2.days),
        status: canceled_status,
        canceled_at: Time.current
      )
    end

    let!(:newer_reservation) do
      create_customer_reservation(
        customer: customer,
        starts_at: reservation_time(Time.zone.today - 1.day),
        status: confirmed_status
      )
    end

    let!(:other_customer_reservation) do
      create_customer_reservation(
        customer: other_customer,
        starts_at: reservation_time(Time.zone.today - 1.day),
        status: confirmed_status
      )
    end

    it "指定した顧客の予約だけを返す" do
      get "/api/v1/customers/#{customer.id}/reservations"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["status"]).to eq("success")

      reservations =
        response.parsed_body.dig("data", "reservations")

      reservation_ids =
        reservations.map { |reservation| reservation["id"] }

      expect(reservation_ids).to contain_exactly(
        older_reservation.id,
        canceled_reservation.id,
        newer_reservation.id
      )

      expect(reservation_ids).not_to include(
        other_customer_reservation.id
      )
    end

    it "予約日時の新しい順で返す" do
      get "/api/v1/customers/#{customer.id}/reservations"

      reservation_ids =
        response
          .parsed_body
          .dig("data", "reservations")
          .map { |reservation| reservation["id"] }

      expect(reservation_ids).to eq(
        [
          newer_reservation.id,
          canceled_reservation.id,
          older_reservation.id
        ]
      )
    end

    it "キャンセル済み予約も返す" do
      get "/api/v1/customers/#{customer.id}/reservations"

      reservations =
        response.parsed_body.dig("data", "reservations")

      canceled_json =
        reservations.find do |reservation|
          reservation["id"] == canceled_reservation.id
        end

      expect(canceled_json).to be_present
      expect(canceled_json["canceled_at"]).to be_present
      expect(
        canceled_json.dig("reservation_status", "code")
      ).to eq("canceled")
    end

    it "ページネーション情報を返す" do
      get(
        "/api/v1/customers/#{customer.id}/reservations",
        params: {
          page: 2,
          per_page: 2
        }
      )

      expect(response).to have_http_status(:ok)

      reservations =
        response.parsed_body.dig("data", "reservations")

      pagination =
        response.parsed_body.dig("data", "pagination")

      expect(
        reservations.map { |reservation| reservation["id"] }
      ).to eq([older_reservation.id])

      expect(pagination).to eq(
        {
          "current_page" => 2,
          "per_page" => 2,
          "total_pages" => 2,
          "total_count" => 3
        }
      )
    end

    it "存在しない顧客の場合は404を返す" do
      get "/api/v1/customers/999999/reservations"

      expect(response).to have_http_status(:not_found)
      expect(response.parsed_body["status"]).to eq("error")
    end
  end
end