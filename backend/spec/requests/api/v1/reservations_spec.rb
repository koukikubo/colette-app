require "rails_helper"

RSpec.describe "Api::V1::Reservations", type: :request do
  let!(:staff_master) do
    StaffMaster.create!(
      code: "00001",
      name: "管理者",
      role_code: "owner",
      employment_started_on: Date.current
    )
  end

  let!(:staff) do
    Staff.create!(
      staff_master: staff_master,
      password: "password",
      password_confirmation: "password",
      login_enabled: true
    )
  end

  let!(:restaurant_master_type_master) do
    StandardMaster.create!(
      system_key: "restaurant_master_type",
      name: "予約席種",
      active: true,
      position: 1
    )
  end

  let!(:table_type) do
    StandardListMaster.create!(
      standard_master: restaurant_master_type_master,
      code: "T",
      label: "テーブル席",
      active: true,
      position: 1
    )
  end

  let!(:counter_type) do
    StandardListMaster.create!(
      standard_master: restaurant_master_type_master,
      code: "C",
      label: "カウンター席",
      active: true,
      position: 2
    )
  end

  let!(:reservation_status_master) do
    StandardMaster.create!(
      system_key: "reservation_status",
      name: "予約状態",
      active: true,
      position: 2
    )
  end

  let!(:confirmed_status) do
    StandardListMaster.create!(
      standard_master: reservation_status_master,
      code: "confirmed",
      label: "予約確定",
      active: true,
      position: 1
    )
  end

  let!(:canceled_status) do
    StandardListMaster.create!(
      standard_master: reservation_status_master,
      code: "canceled",
      label: "取消",
      active: true,
      position: 2
    )
  end

  let!(:reservation_route_master) do
    StandardMaster.create!(
      system_key: "reservation_route",
      name: "予約経路",
      active: true,
      position: 3
    )
  end

  let!(:phone_route) do
    StandardListMaster.create!(
      standard_master: reservation_route_master,
      code: "phone",
      label: "電話",
      active: true,
      position: 1
    )
  end

  let!(:restaurant_master) do
    RestaurantMaster.create!(
      name: "テーブル1",
      code: "T01",
      capacity: 4,
      restaurant_master_type: table_type,
      sequence_number: 1,
      active: true,
      position: 1,
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  let!(:another_restaurant_master) do
    RestaurantMaster.create!(
      name: "テーブル2",
      code: "T02",
      capacity: 4,
      restaurant_master_type: table_type,
      sequence_number: 2,
      active: true,
      position: 2,
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  let!(:customer) do
    Customer.create!(
      customer_kind: "individual",
      name: "久保 光輝",
      kana: "クボ コウキ",
      phone_number: "09012345678",
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  before do
    login_as_staff(staff)
    get "/api/v1/staff/current"
  end

  describe "GET /api/v1/reservations" do
    let!(:today_reservation) do
      Reservation.create!(
        customer: customer,
        reservation_name: customer.name,
        reservation_phone_number: customer.phone_number,
        starts_at: reservation_time(Time.zone.today, 18),
        ends_at: reservation_time(Time.zone.today, 20),
        guest_count: 2,
        requested_restaurant_master_type: table_type,
        reservation_status: confirmed_status,
        reservation_route: phone_route,
        created_by_staff: staff,
        updated_by_staff: staff
      )
    end

    let!(:tomorrow_reservation) do
      Reservation.create!(
        reservation_name: "明日の予約",
        reservation_phone_number: "09099998888",
        starts_at: reservation_time(Time.zone.tomorrow, 18),
        ends_at: reservation_time(Time.zone.tomorrow, 20),
        guest_count: 2,
        requested_restaurant_master_type: table_type,
        reservation_status: confirmed_status,
        created_by_staff: staff,
        updated_by_staff: staff
      )
    end

    it "date未指定の場合、当日の予約一覧を返す" do
      get "/api/v1/reservations"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      reservations = json.dig("data", "reservations")

      expect(reservations.size).to eq(1)
      expect(reservations.first["id"]).to eq(today_reservation.id)
      expect(reservations.first["reservation_name"]).to eq("久保 光輝")
    end

    it "date指定の場合、指定日の予約一覧を返す" do
      get "/api/v1/reservations", params: {
        date: Time.zone.tomorrow.to_s
      }

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      reservations = json.dig("data", "reservations")

      expect(reservations.size).to eq(1)
      expect(reservations.first["id"]).to eq(tomorrow_reservation.id)
      expect(reservations.first["reservation_name"]).to eq("明日の予約")
    end
  end

  describe "GET /api/v1/reservations/:id" do
    let!(:reservation) do
      Reservation.create!(
        customer: customer,
        reservation_name: customer.name,
        reservation_phone_number: customer.phone_number,
        starts_at: reservation_time(Time.zone.today, 18).iso8601,
        ends_at: reservation_time(Time.zone.today, 20).iso8601,
        guest_count: 2,
        requested_restaurant_master_type: table_type,
        reservation_status: confirmed_status,
        reservation_route: phone_route,
        created_by_staff: staff,
        updated_by_staff: staff
      )
    end

    before do
      reservation.restaurant_masters << restaurant_master
    end

    it "予約詳細を返す" do
      get "/api/v1/reservations/#{reservation.id}"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)
      reservation_json = json.dig("data", "reservation")

      expect(reservation_json["id"]).to eq(reservation.id)
      expect(reservation_json["reservation_name"]).to eq("久保 光輝")
      expect(reservation_json["customer"]["id"]).to eq(customer.id)
      expect(reservation_json["requested_restaurant_master_type"]["label"]).to eq("テーブル席")
      expect(reservation_json["reservation_status"]["label"]).to eq("予約確定")
      expect(reservation_json["restaurant_master_ids"]).to eq([ restaurant_master.id ])
      expect(reservation_json["restaurant_masters"].first["code"]).to eq("T01")
    end
  end

  describe "POST /api/v1/reservations" do
    it "一見客の予約を作成できる" do
      expect do
        post "/api/v1/reservations", params: {
          reservation: {
            reservation_name: "山田 太郎",
            reservation_phone_number: "09011112222",
            starts_at:
              reservation_time(Time.zone.today, 18).iso8601,
            ends_at:
              reservation_time(Time.zone.today, 20).iso8601,
            guest_count: 2,
            requested_restaurant_master_type_id: table_type.id,
            reservation_route_id: phone_route.id,
            restaurant_master_ids: [ restaurant_master.id ],
            reservation_status_id: confirmed_status.id
          }
        },
        headers: csrf_headers
      end.to change(Reservation, :count).by(1)
        .and change(ReservationTable, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it "複数の実テーブルで予約人数分の定員を確保して作成できる" do
      expect do
        post "/api/v1/reservations", params: {
          reservation: {
            reservation_name: "8名予約",
            reservation_phone_number: "09011112222",
            starts_at: reservation_time(Time.zone.today, 18).iso8601,
            ends_at: reservation_time(Time.zone.today, 20).iso8601,
            guest_count: 8,
            requested_restaurant_master_type_id: table_type.id,
            reservation_status_id: confirmed_status.id,
            restaurant_master_ids: [
              restaurant_master.id,
              another_restaurant_master.id
            ]
          }
        },
        headers: csrf_headers
      end.to change(Reservation, :count).by(1)
        .and change(ReservationTable, :count).by(2)

      expect(response).to have_http_status(:created)

      reservation = Reservation.last

      expect(reservation.restaurant_masters)
        .to contain_exactly(
          restaurant_master,
          another_restaurant_master
        )
    end

    it "実テーブルの合計定員が予約人数を下回る場合は作成できない" do
      expect do
        post "/api/v1/reservations", params: {
          reservation: {
            reservation_name: "定員超過予約",
            reservation_phone_number: "09011112222",
            starts_at: reservation_time(Time.zone.today, 18).iso8601,
            ends_at: reservation_time(Time.zone.today, 20).iso8601,
            guest_count: 8,
            requested_restaurant_master_type_id: table_type.id,
            reservation_status_id: confirmed_status.id,
            restaurant_master_ids: [ restaurant_master.id ]
          }
        },
        headers: csrf_headers
      end.not_to change(Reservation, :count)

      expect(response).to have_http_status(:unprocessable_content)

      expect(
        response.parsed_body.dig(
          "errors",
          "restaurant_master_ids"
        )
      ).to include(
        "確定テーブルでは予約人数分の定員を確保できません"
      )
    end

    it "既存顧客を選択した場合、顧客マスタの名前を予約名に反映する" do
      post "/api/v1/reservations", params: {
        reservation: {
          customer_id: customer.id,
          reservation_name: "別名",
          reservation_phone_number: "08099998888",
          starts_at: reservation_time(Time.zone.today, 18),
          ends_at: reservation_time(Time.zone.today, 20),
          guest_count: 2,
          requested_restaurant_master_type_id: table_type.id,
          reservation_status_id: confirmed_status.id,
          restaurant_master_ids: []
        }
      },
      headers: csrf_headers


      expect(response).to have_http_status(:created)

      reservation = Reservation.last

      expect(reservation.customer).to eq(customer)
      expect(reservation.reservation_name).to eq("久保 光輝")
      expect(reservation.reservation_phone_number).to eq("08099998888")
      expect(reservation.restaurant_master_ids).to eq([])
    end

    it "同じ実テーブル・重複時間の予約は作成できない" do
      existing_reservation =
        Reservation.create!(
          reservation_name: "既存予約",
          reservation_phone_number: "09022223333",
          starts_at: reservation_time(Time.zone.today, 18),
          ends_at: reservation_time(Time.zone.today, 20),
          guest_count: 2,
          requested_restaurant_master_type: table_type,
          reservation_status: confirmed_status,
          created_by_staff: staff,
          updated_by_staff: staff
        )

      existing_reservation.restaurant_masters << restaurant_master

      expect do
        post "/api/v1/reservations", params: {
          reservation: {
            reservation_name: "重複予約",
            reservation_phone_number: "09033334444",
            starts_at: reservation_time(Time.zone.today, 18),
            ends_at: reservation_time(Time.zone.today, 20),
            guest_count: 2,
            requested_restaurant_master_type_id: table_type.id,
            reservation_status_id: confirmed_status.id,
            restaurant_master_ids: [ restaurant_master.id ]
          }
        }
      end.not_to change(Reservation, :count)

      expect(response).to have_http_status(:unprocessable_content)
    end
    it "同一顧客の予約時間が重複する場合は422を返す" do
      Reservation.create!(
        customer: customer,
        reservation_name: customer.name,
        reservation_phone_number: customer.phone_number,
        starts_at: reservation_time(Time.zone.today, 18),
        ends_at: reservation_time(Time.zone.today, 20),
        guest_count: 2,
        requested_restaurant_master_type: table_type,
        reservation_status: confirmed_status,
        created_by_staff: staff,
        updated_by_staff: staff
      )

      expect do
        post "/api/v1/reservations", params: {
          reservation: {
            customer_id: customer.id,
            reservation_name: customer.name,
            reservation_phone_number: customer.phone_number,
            starts_at: reservation_time(Time.zone.today, 19).iso8601,
            ends_at: reservation_time(Time.zone.today, 21).iso8601,
            guest_count: 2,
            requested_restaurant_master_type_id: table_type.id,
            reservation_status_id: confirmed_status.id,
            restaurant_master_ids: []
          }
        },
        headers: csrf_headers
      end.not_to change(Reservation, :count)

      expect(response).to have_http_status(:unprocessable_content)

      expect(
        response.parsed_body.dig("errors", "customer_id")
      ).to include(
        "顧客は同じ時間帯に別の予約が登録されています"
      )
    end

    it "予約ステータスが未選択の場合は作成できない" do
      expect do
        post "/api/v1/reservations", params: {
          reservation: {
            reservation_name: "山田 太郎",
            reservation_phone_number: "09011112222",
            starts_at: reservation_time(Time.zone.today, 18),
            ends_at: reservation_time(Time.zone.today, 20),
            guest_count: 2,
            requested_restaurant_master_type_id: table_type.id,
            restaurant_master_ids: []
          }
        },
        headers: csrf_headers
      end.not_to change(Reservation, :count)

      expect(response).to have_http_status(:unprocessable_content)

      expect(
        response.parsed_body.dig("errors", "reservation_status")
      ).to be_present
    end

    it "予約状況に別カテゴリのIDを指定した場合は作成できない" do
      expect do
        post "/api/v1/reservations", params: {
          reservation: {
            reservation_name: "山田 太郎",
            reservation_phone_number: "09011112222",
            starts_at: reservation_time(Time.zone.today, 18),
            ends_at: reservation_time(Time.zone.today, 20),
            guest_count: 2,
            requested_restaurant_master_type_id: table_type.id,
            reservation_status_id: table_type.id,
            restaurant_master_ids: []
          }
        },
        headers: csrf_headers
      end.not_to change(Reservation, :count)

      expect(response).to have_http_status(:unprocessable_content)

      expect(
        response.parsed_body.dig("errors", "reservation_status")
      ).to be_present
    end
  end

  describe "PATCH /api/v1/reservations/:id" do
    let!(:reservation) do
      Reservation.create!(
        reservation_name: "更新前",
        reservation_phone_number: "09011112222",
        starts_at: reservation_time(Time.zone.today, 18),
        ends_at: reservation_time(Time.zone.today, 20),
        guest_count: 2,
        requested_restaurant_master_type: table_type,
        reservation_status: confirmed_status,
        created_by_staff: staff,
        updated_by_staff: staff
      )
    end

    it "予約を更新できる" do
      patch "/api/v1/reservations/#{reservation.id}", params: {
        reservation: {
          reservation_name: "更新後",
          reservation_phone_number: "09011112222",
          starts_at: reservation_time(Time.zone.today, 18).iso8601,
          ends_at: reservation_time(Time.zone.today, 21).iso8601,
          guest_count: 3,
          requested_restaurant_master_type_id: table_type.id,
          lock_version: reservation.lock_version,
          restaurant_master_ids: [ restaurant_master.id ]
        }
      },
      headers: csrf_headers

      expect(response).to have_http_status(:ok)

      reservation.reload

      expect(reservation.reservation_name).to eq("更新後")
      expect(reservation.ends_at.hour).to eq(21)
      expect(reservation.guest_count).to eq(3)
      expect(reservation.updated_by_staff).to eq(staff)
      expect(reservation.restaurant_master_ids).to eq([ restaurant_master.id ])
    end

    it "複数の実テーブルで予約人数分の定員を確保して更新できる" do
      patch "/api/v1/reservations/#{reservation.id}", params: {
        reservation: {
          reservation_name: reservation.reservation_name,
          reservation_phone_number: reservation.reservation_phone_number,
          starts_at: reservation.starts_at.iso8601,
          ends_at: reservation.ends_at.iso8601,
          guest_count: 8,
          requested_restaurant_master_type_id: table_type.id,
          restaurant_master_ids: [
            restaurant_master.id,
            another_restaurant_master.id
          ],
          lock_version: reservation.lock_version
        }
      },
      headers: csrf_headers

      expect(response).to have_http_status(:ok)

      reservation.reload

      expect(reservation.guest_count).to eq(8)
      expect(reservation.restaurant_masters)
        .to contain_exactly(
          restaurant_master,
          another_restaurant_master
        )
    end

    it "実テーブルの合計定員が予約人数を下回る場合は更新できない" do
      reservation.restaurant_masters << restaurant_master

      patch "/api/v1/reservations/#{reservation.id}", params: {
        reservation: {
          reservation_name: "定員超過による更新",
          reservation_phone_number: reservation.reservation_phone_number,
          starts_at: reservation.starts_at.iso8601,
          ends_at: reservation.ends_at.iso8601,
          guest_count: 8,
          requested_restaurant_master_type_id: table_type.id,
          restaurant_master_ids: [ restaurant_master.id ],
          lock_version: reservation.lock_version
        }
      },
      headers: csrf_headers

      expect(response).to have_http_status(:unprocessable_content)

      expect(
        response.parsed_body.dig(
          "errors",
          "restaurant_master_ids"
        )
      ).to include(
        "確定テーブルでは予約人数分の定員を確保できません"
      )

      reservation.reload

      expect(reservation.reservation_name).to eq("更新前")
      expect(reservation.guest_count).to eq(2)
      expect(reservation.restaurant_masters)
        .to contain_exactly(restaurant_master)
    end

    it "restaurant_master_idsを送らない場合、実テーブル割当を変更しない" do
      reservation.restaurant_masters << restaurant_master

      patch "/api/v1/reservations/#{reservation.id}", params: {
        reservation: {
          reservation_name: "席は維持",
          reservation_phone_number: "09011112222",
          starts_at: reservation.starts_at,
          ends_at: reservation.ends_at,
          guest_count: reservation.guest_count,
          requested_restaurant_master_type_id: table_type.id,
          lock_version: reservation.lock_version
        }
      },
      headers: csrf_headers

      expect(response).to have_http_status(:ok)

      reservation.reload

      expect(reservation.reservation_name).to eq("席は維持")
      expect(reservation.restaurant_master_ids).to eq([ restaurant_master.id ])
    end

    it "restaurant_master_idsに空配列を送ると、実テーブル割当を解除する" do
      reservation.restaurant_masters << restaurant_master

      patch "/api/v1/reservations/#{reservation.id}", params: {
        reservation: {
          reservation_name: reservation.reservation_name,
          reservation_phone_number: reservation.reservation_phone_number,
          starts_at: reservation.starts_at,
          ends_at: reservation.ends_at,
          guest_count: reservation.guest_count,
          requested_restaurant_master_type_id: table_type.id,
          lock_version: reservation.lock_version,
          restaurant_master_ids: []
        }
      },
      headers: csrf_headers

      expect(response).to have_http_status(:ok)

      reservation.reload

      expect(reservation.restaurant_master_ids).to eq([])
    end

    it "古いlock_versionの場合は409を返す" do
      stale_lock_version = reservation.lock_version

      # 編集画面を開いた後、別の担当者が先に更新した状況を再現する。
      reservation.update!(
        internal_memo: "別の担当者による更新"
      )

      patch "/api/v1/reservations/#{reservation.id}", params: {
        reservation: {
          reservation_name: "競合更新",
          reservation_phone_number: reservation.reservation_phone_number,
          starts_at: reservation.starts_at.iso8601,
          ends_at: reservation.ends_at.iso8601,
          guest_count: reservation.guest_count,
          requested_restaurant_master_type_id: table_type.id,
          lock_version: stale_lock_version
        }
      },
      headers: csrf_headers

      expect(response).to have_http_status(:conflict)

      response_body = response.parsed_body

      expect(response_body["status"]).to eq("error")
      expect(response_body["message"])
        .to eq("予約情報は別の担当者によって更新されています")
      expect(response_body["errors"]).to include(
        "最新の予約情報を再取得してから、もう一度操作してください"
      )

      reservation.reload

      expect(reservation.reservation_name).to eq("更新前")
      expect(reservation.internal_memo).to eq("別の担当者による更新")
    end

    it "lock_versionがない場合は更新できない" do
      patch "/api/v1/reservations/#{reservation.id}", params: {
        reservation: {
          reservation_name: "lockなし更新",
          reservation_phone_number: "09011112222",
          starts_at: reservation.starts_at,
          ends_at: reservation.ends_at,
          guest_count: reservation.guest_count,
          requested_restaurant_master_type_id: table_type.id
        }
      },
      headers: csrf_headers

      expect(response).to have_http_status(:bad_request)
    end

    it "更新により同一顧客の別予約と時間が重複する場合は422を返す" do
      Reservation.create!(
        customer: customer,
        reservation_name: customer.name,
        reservation_phone_number: customer.phone_number,
        starts_at: reservation_time(Time.zone.today, 18),
        ends_at: reservation_time(Time.zone.today, 20),
        guest_count: 2,
        requested_restaurant_master_type: table_type,
        reservation_status: confirmed_status,
        created_by_staff: staff,
        updated_by_staff: staff
      )

      patch "/api/v1/reservations/#{reservation.id}", params: {
        reservation: {
          customer_id: customer.id,
          reservation_name: customer.name,
          reservation_phone_number: customer.phone_number,
          starts_at: reservation_time(Time.zone.today, 19).iso8601,
          ends_at: reservation_time(Time.zone.today, 21).iso8601,
          guest_count: 2,
          requested_restaurant_master_type_id: table_type.id,
          lock_version: reservation.lock_version,
          restaurant_master_ids: []
        }
      },
      headers: csrf_headers

      expect(response).to have_http_status(:unprocessable_content)

      expect(
        response.parsed_body.dig("errors", "customer_id")
      ).to include(
        "顧客は同じ時間帯に別の予約が登録されています"
      )

      reservation.reload

      expect(reservation.customer_id).to be_nil
      expect(reservation.starts_at).to eq(
        reservation_time(Time.zone.today, 18)
      )
      expect(reservation.ends_at).to eq(
        reservation_time(Time.zone.today, 20)
      )
    end
  end

  describe "PATCH /api/v1/reservations/:id/cancel" do
    let!(:reservation) do
      create(
        :reservation,
        reservation_name: "キャンセル対象",
        reservation_phone_number: "09011112222",
        starts_at: reservation_time(Time.zone.today, 18),
        ends_at: reservation_time(Time.zone.today, 20),
        requested_restaurant_master_type: table_type,
        reservation_status: confirmed_status,
        created_by_staff: staff,
        updated_by_staff: staff,
        canceled_at: nil
      )
    end

    it "予約をキャンセルできる" do
      patch(
        "/api/v1/reservations/#{reservation.id}/cancel",
        params: {
          reservation: {
            lock_version: reservation.lock_version
          }
        },
        headers: csrf_headers
      )

      expect(response).to have_http_status(:ok)

      reservation.reload

      expect(reservation.canceled_at).to be_present
      expect(reservation.updated_by_staff).to eq(staff)
    end

    it "キャンセル済み予約は再度キャンセルできない" do
      reservation.update!(
        canceled_at: Time.current
      )

      original_canceled_at = reservation.canceled_at

      patch(
        "/api/v1/reservations/#{reservation.id}/cancel",
        params: {
          reservation: {
            lock_version: reservation.lock_version
          }
        },
        headers: csrf_headers
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(reservation.reload.canceled_at).to eq(original_canceled_at)
    end

    it "lock_versionがない場合はキャンセルできない" do
      patch(
        "/api/v1/reservations/#{reservation.id}/cancel",
        params: {
          reservation: {}
        },
        headers: csrf_headers
      )

      expect(response).to have_http_status(:bad_request)
      expect(reservation.reload.canceled_at).to be_nil
    end

    it "存在しない予約の場合は404を返す" do
      patch(
        "/api/v1/reservations/999999999/cancel",
        params: {
          reservation: {
            lock_version: 0
          }
        },
        headers: csrf_headers
      )

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "PATCH /api/v1/reservations/:id/restore" do
    let!(:reservation) do
      create(
        :reservation,
        :canceled,
        reservation_name: "復元対象",
        reservation_phone_number: "09011112222",
        starts_at: reservation_time(Time.zone.today, 18),
        ends_at: reservation_time(Time.zone.today, 20),
        requested_restaurant_master_type: table_type,
        reservation_status: canceled_status,
        created_by_staff: staff,
        updated_by_staff: staff
      )
    end

    before do
      reservation.restaurant_masters << restaurant_master
    end

    it "キャンセル済み予約を復元できる" do
      patch(
        "/api/v1/reservations/#{reservation.id}/restore",
        params: {
          reservation: {
            lock_version: reservation.lock_version
          }
        },
        headers: csrf_headers
      )

      expect(response).to have_http_status(:ok)

      reservation.reload

      expect(reservation.canceled_at).to be_nil
      expect(reservation.updated_by_staff).to eq(staff)
    end

    it "キャンセルされていない予約は復元できない" do
      reservation.update!(
        canceled_at: nil,
        reservation_status: confirmed_status
      )

      patch(
        "/api/v1/reservations/#{reservation.id}/restore",
        params: {
          reservation: {
            lock_version: reservation.lock_version
          }
        },
        headers: csrf_headers
      )

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "復元時に二重予約となる場合は復元できない" do
      conflicting_reservation =
        create(
          :reservation,
          reservation_name: "競合予約",
          reservation_phone_number: "09099998888",
          starts_at: reservation.starts_at,
          ends_at: reservation.ends_at,
          requested_restaurant_master_type: table_type,
          reservation_status: confirmed_status,
          created_by_staff: staff,
          updated_by_staff: staff,
          canceled_at: nil
        )

      conflicting_reservation.restaurant_masters << restaurant_master

      patch(
        "/api/v1/reservations/#{reservation.id}/restore",
        params: {
          reservation: {
            lock_version: reservation.lock_version
          }
        },
        headers: csrf_headers
      )

      expect(response).to have_http_status(:unprocessable_content)
      expect(reservation.reload.canceled_at).to be_present
    end

    it "lock_versionがない場合は復元できない" do
      patch(
        "/api/v1/reservations/#{reservation.id}/restore",
        params: {
          reservation: {}
        },
        headers: csrf_headers
      )

      expect(response).to have_http_status(:bad_request)
      expect(reservation.reload.canceled_at).to be_present
    end

    it "存在しない予約の場合は404を返す" do
      patch(
        "/api/v1/reservations/999999999/restore",
        params: {
          reservation: {
            lock_version: 0
          }
        },
        headers: csrf_headers
      )

      expect(response).to have_http_status(:not_found)
    end
  end

  def login_as_staff(staff)
    post "/api/v1/staff/login", params: {
      staff: {
        staff_id: staff.id,
        password: "password"
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

  def reservation_time(date, hour, min = 0)
    Time.zone.local(
      date.year,
      date.month,
      date.day,
      hour,
      min
    )
  end
end
