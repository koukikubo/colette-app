require "rails_helper"

RSpec.describe "予約の並行操作と割当の原子性", type: :request do
  include_context "independent integrity connections"

  def seat_for(staff, type)
    tracked(:restaurant_master, restaurant_master_type: type, capacity: 4, created_by_staff: staff, updated_by_staff: staff)
  end

  def create_booking(attributes, staff)
    Reservations::CreateService.call(attributes: attributes, current_staff: staff)
  end

  def attempt
    yield
    :success
  rescue ActiveRecord::RecordInvalid
    :rejected
  end

  # セッションとレスポンスを共有せず、復元の実Controller経路を独立接続で検証する。
  def signed_in_session(staff)
    session = ActionDispatch::Integration::Session.new(Rails.application)
    session.get "/api/v1/csrf", as: :json
    token = JSON.parse(session.response.body).dig("data", "csrf_token")
    session.post "/api/v1/staff/login", params: { staff: { staff_id: staff.id, password: "Password123!" } },
      headers: { "X-CSRF-Token" => token }, as: :json
    expect(session.response.status).to eq(200)
    @records << StaffSession.where(staff_id: staff.id).order(:id).last
    session.get "/api/v1/csrf", as: :json
    token = JSON.parse(session.response.body).dig("data", "csrf_token")
    [ session, { "X-CSRF-Token" => token, "Idempotency-Key" => SecureRandom.uuid } ]
  end

  it "異なる顧客が同じ席を作成しても1件だけを割り当てる" do
    staff, type, attributes = booking_setup
    seat = seat_for(staff, type)
    customers = 2.times.map { tracked(:customer, name: @marker, created_by_staff: staff, updated_by_staff: staff) }
    results = concurrently do |index|
      attempt { create_booking(attributes.merge(customer_id: customers[index].id, restaurant_master_ids: [ seat.id ]), staff) }
    end
    expect(results.sort).to eq([ :rejected, :success ])
    expect(Reservation.where(reservation_name: @marker).count).to eq(1)
    expect(ReservationTable.where(restaurant_master_id: seat.id).count).to eq(1)
  end

  it "キャンセル復元と新規作成で同じ席を二重に使用しない" do
    staff, type, attributes = booking_setup
    seat = seat_for(staff, type)
    canceled = create_booking(attributes.merge(restaurant_master_ids: [ seat.id ], canceled_at: Time.current), staff)
    sessions = 2.times.map { signed_in_session(staff) }
    statuses = concurrently do |index|
      session, headers = sessions[index]
      if index.zero?
        session.patch "/api/v1/reservations/#{canceled.id}/restore",
          params: { reservation: { lock_version: canceled.lock_version } }, headers: headers, as: :json
      else
        session.post "/api/v1/reservations", params: { reservation: attributes.merge(restaurant_master_ids: [ seat.id ]) }, headers: headers, as: :json
      end
      session.response.status
    end
    expect(statuses.count { |status| status.between?(200, 299) }).to eq(1)
    expect(statuses.count(422)).to eq(1)
    active = Reservation.active.joins(:reservation_tables).where(reservation_tables: { restaurant_master_id: seat.id })
    expect(active.count).to eq(1)
    # 復元が負けた場合はキャンセル日時・版を変更しない。
    if statuses.first == 422
      expect(canceled.reload).to have_attributes(canceled_at: be_present, lock_version: 0)
    end
  end

  it "席変更と新規作成が競合しても、負けた更新の本文や元の席を保存しない" do
    staff, type, attributes = booking_setup
    target = seat_for(staff, type)
    original = seat_for(staff, type)
    editing = create_booking(attributes.merge(restaurant_master_ids: [ original.id ], internal_memo: "変更前"), staff)
    results = concurrently do |index|
      attempt do
        if index.zero?
          Reservations::UpdateService.call(reservation: Reservation.find(editing.id),
            attributes: { restaurant_master_ids: [ target.id ], internal_memo: "変更後", lock_version: editing.lock_version }, current_staff: staff)
        else
          create_booking(attributes.merge(restaurant_master_ids: [ target.id ]), staff)
        end
      end
    end
    expect(results.sort).to eq([ :rejected, :success ])
    expect(ReservationTable.where(restaurant_master_id: target.id).count).to eq(1)
    editing.reload
    if results.first == :rejected
      expect(editing.internal_memo).to eq("変更前")
      expect(editing.restaurant_master_ids).to eq([ original.id ])
      expect(editing.lock_version).to eq(0)
    else
      expect(editing.internal_memo).to eq("変更後")
      expect(editing.restaurant_master_ids).to eq([ target.id ])
    end
  end

  it "終了と開始が一致する隣接時間帯は同じ席でも両方成功する" do
    staff, type, attributes = booking_setup
    seat = seat_for(staff, type)
    results = concurrently do |index|
      offset = index.hours * 2
      attempt { create_booking(attributes.merge(starts_at: attributes[:starts_at] + offset, ends_at: attributes[:ends_at] + offset, restaurant_master_ids: [ seat.id ]), staff) }
    end
    expect(results).to eq([ :success, :success ])
    expect(ReservationTable.where(restaurant_master_id: seat.id).count).to eq(2)
  end

  it "複数席の逆順指定でもデッドロックや一部割当を残さない" do
    staff, type, attributes = booking_setup
    seats = 2.times.map { seat_for(staff, type) }
    results = concurrently do |index|
      ids = seats.map(&:id)
      ids.reverse! if index == 1
      attempt { create_booking(attributes.merge(guest_count: 8, restaurant_master_ids: ids), staff) }
    end
    expect(results.sort).to eq([ :rejected, :success ])
    bookings = Reservation.where(reservation_name: @marker)
    expect(bookings.count).to eq(1)
    expect(bookings.first.restaurant_master_ids.sort).to eq(seats.map(&:id).sort)
    expect(ReservationTable.where(restaurant_master_id: seats.map(&:id)).count).to eq(2)
  end

  it "別の席の同時作成を誤って拒否しない" do
    staff, type, attributes = booking_setup
    seats = 2.times.map { seat_for(staff, type) }
    results = concurrently do |index|
      attempt { create_booking(attributes.merge(restaurant_master_ids: [ seats[index].id ]), staff) }
    end
    expect(results).to eq([ :success, :success ])
    expect(Reservation.where(reservation_name: @marker).count).to eq(2)
  end
end
