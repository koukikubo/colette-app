require "rails_helper"

RSpec.describe "予約の手動退店と来店結果訂正", type: :request do
  include_context "authenticated request"

  let(:category) { create(:standard_master, system_key: "reservation_status") }
  let!(:confirmed) { create(:standard_list_master, standard_master: category, code: "confirmed") }
  let!(:tentative) { create(:standard_list_master, standard_master: category, code: "tentative") }
  let(:type) { create(:standard_list_master, standard_master: create(:standard_master, system_key: "restaurant_master_type")) }
  let!(:booking) do
    create(:reservation, starts_at: 1.day.ago.change(hour: 18), ends_at: 1.day.ago.change(hour: 20),
      reservation_status: confirmed, requested_restaurant_master_type: type,
      created_by_staff: login_staff, updated_by_staff: login_staff)
  end

  before { login! }

  def change_result(action, attributes = {}, headers: authenticated_headers, **keywords)
    patch "/api/v1/reservations/#{booking.id}/#{action}",
      params: { reservation: { lock_version: booking.lock_version }.merge(attributes).merge(keywords) }, headers: headers, as: :json
  end

  it "手動退店でのみ実績が確定し、予定終了日時は変更しない" do
    original_end = booking.ends_at
    change_result("complete")
    expect(response).to have_http_status(:ok), response.body
    expect(booking.reload).to have_attributes(completed_at: be_present, canceled_at: nil, ends_at: original_end)
    expect(response.parsed_body.dig("data", "reservation", "visit_result")).to eq("checked_out")
    expect(ReservationResultChange.where(reservation: booking).count).to eq(1)
  end

  it "未来の予約は退店・無断キャンセルにしない" do
    booking.update!(starts_at: 1.day.from_now.change(hour: 18), ends_at: 1.day.from_now.change(hour: 20))
    %w[complete no_show].each do |action|
      change_result(action)
      expect(response).to have_http_status(:unprocessable_content)
    end
    expect(booking.reload.completed_at).to be_nil
  end

  it "仮予約は明示した確認がある場合だけ予約確定と退店を同時保存する" do
    booking.update!(reservation_status: tentative)
    change_result("complete")
    expect(response).to have_http_status(:unprocessable_content)
    change_result("complete", confirm_tentative: true)
    expect(response).to have_http_status(:ok), response.body
    expect(booking.reload).to have_attributes(reservation_status_id: confirmed.id, completed_at: be_present)
  end

  it "無断キャンセルは理由なしで登録・訂正でき、監査を残す" do
    change_result("no_show")
    expect(response).to have_http_status(:ok), response.body
    expect(booking.reload).to have_attributes(cancellation_kind: "no_show", completed_at: nil)
    change_result("correct_result", visit_result: "checked_out")
    expect(response).to have_http_status(:ok), response.body
    expect(booking.reload).to have_attributes(cancellation_kind: nil, canceled_at: nil, completed_at: be_present)
    expect(ReservationResultChange.where(reservation: booking).count).to eq(2)
  end

  it "退店から通常キャンセルへの訂正は理由必須で一体保存する" do
    change_result("complete")
    booking.reload
    change_result("correct_result", visit_result: "canceled")
    expect(response).to have_http_status(:unprocessable_content)
    expect(booking.reload.completed_at).to be_present
    change_result("correct_result", visit_result: "canceled", reason: "誤った退店操作")
    expect(response).to have_http_status(:ok), response.body
    expect(booking.reload).to have_attributes(completed_at: nil, canceled_at: be_present, cancellation_kind: "regular")
  end

  it "退店から無断キャンセルへの訂正は理由不要" do
    change_result("complete")
    booking.reload
    change_result("correct_result", visit_result: "no_show")
    expect(response).to have_http_status(:ok), response.body
    expect(booking.reload).to have_attributes(completed_at: nil, cancellation_kind: "no_show")
  end

  it "応答喪失後の同じ再送では版と監査を増やさず、異なる入力は409" do
    headers = authenticated_headers
    change_result("complete", headers: headers)
    expect(response).to have_http_status(:ok), response.body
    change_result("complete", headers: headers)
    expect(response).to have_http_status(:ok), response.body
    expect(booking.reload.lock_version).to eq(1)
    expect(ReservationResultChange.where(reservation: booking).count).to eq(1)
    change_result("cancel", headers: headers)
    expect(response).to have_http_status(:conflict)
  end

  it "古い版の更新は409で拒否する" do
    booking.update!(internal_memo: "他の担当者の更新")
    change_result("complete", lock_version: 0)
    expect(response).to have_http_status(:conflict)
    expect(booking.reload.completed_at).to be_nil
  end

  it "監査保存が失敗した場合は退店も保存しない" do
    allow(ReservationResultChange).to receive(:create!).and_raise(ActiveRecord::RecordInvalid.new(booking))
    change_result("complete")
    expect(response).to have_http_status(:unprocessable_content)
    expect(booking.reload.completed_at).to be_nil
    expect(booking.lock_version).to eq(0)
  end

  it "退店済みの顧客・日時を通常更新から変更させない" do
    change_result("complete")
    booking.reload
    patch "/api/v1/reservations/#{booking.id}", params: { reservation: {
      lock_version: booking.lock_version, starts_at: 2.days.ago.change(hour: 18), ends_at: 2.days.ago.change(hour: 20)
    } }, headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:unprocessable_content)
  end
  it "退店済みの日時・顧客の訂正は来店結果と監査を一体保存する" do
    change_result("complete")
    booking.reload
    customer = create(:customer, created_by_staff: login_staff, updated_by_staff: login_staff)
    corrected_start = 2.days.ago.change(hour: 18)
    change_result("correct_result", visit_result: "checked_out", reason: "顧客と日付の誤登録", booking: {
      customer_id: customer.id, starts_at: corrected_start, ends_at: corrected_start + 2.hours
    })
    expect(response).to have_http_status(:ok), response.body
    expect(booking.reload).to have_attributes(customer_id: customer.id, starts_at: corrected_start, reservation_name: customer.name)
    event = ReservationResultChange.where(reservation: booking).order(:id).last
    expect(event.before_state["customer_id"]).to be_nil
    expect(event.after_state["customer_id"]).to eq(customer.id)
    get "/api/v1/reservations/#{booking.id}/result_changes", headers: authenticated_headers, as: :json
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("data", "changes").size).to eq(2)
  end

  it "未来へ変更した予約を退店済みのまま保存しない" do
    change_result("complete")
    booking.reload
    future_start = 1.day.from_now.change(hour: 18)
    change_result("correct_result", visit_result: "checked_out", reason: "日付訂正", booking: {
      starts_at: future_start, ends_at: future_start + 2.hours
    })
    expect(response).to have_http_status(:unprocessable_content)
    expect(booking.reload.starts_at).to be < Time.current
    change_result("correct_result", visit_result: "pending", reason: "日付訂正", booking: {
      starts_at: future_start, ends_at: future_start + 2.hours
    })
    expect(response).to have_http_status(:ok), response.body
    expect(booking.reload).to have_attributes(starts_at: future_start, completed_at: nil)
  end

  it "過去の未退店を日付指定なしでページングし、未来・退店済み・取消を除外する" do
    create(:reservation, starts_at: 1.day.from_now.change(hour: 18), ends_at: 1.day.from_now.change(hour: 20),
      requested_restaurant_master_type: type, reservation_status: confirmed, created_by_staff: login_staff, updated_by_staff: login_staff)
    get "/api/v1/reservations", params: { state: "pending_checkout", per_page: 20 }, headers: authenticated_headers
    expect(response).to have_http_status(:ok), response.body
    expect(response.parsed_body.dig("data", "reservations").pluck("id")).to eq([ booking.id ])
    expect(response.parsed_body.dig("data", "pagination", "total_count")).to eq(1)
  end

  it "閲覧専用の担当者は結果を変更できない" do
    login_staff.staff_master.update!(role_code: "viewer")
    login!
    change_result("no_show")
    expect(response).to have_http_status(:forbidden)
    expect(booking.reload.canceled_at).to be_nil
  end
end
