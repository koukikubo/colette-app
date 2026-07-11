require "rails_helper"

RSpec.describe Reservations::DoubleBookingValidator do
  let(:staff) { create(:staff) }

  let(:restaurant_master_type_master) do
    create(
      :standard_master,
      system_key: "restaurant_master_type",
      name: "席種"
    )
  end

  let(:reservation_status_master) do
    create(
      :standard_master,
      system_key: "reservation_status",
      name: "予約ステータス"
    )
  end

  let(:table_type) do
    create(
      :standard_list_master,
      standard_master: restaurant_master_type_master,
      code: "T",
      label: "テーブル席"
    )
  end

  let(:confirmed_status) do
    create(
      :standard_list_master,
      standard_master: reservation_status_master,
      code: "confirmed",
      label: "予約確定"
    )
  end

  let(:restaurant_master) do
    create(
      :restaurant_master,
      restaurant_master_type: table_type,
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  let(:another_restaurant_master) do
    create(
      :restaurant_master,
      restaurant_master_type: table_type,
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  let(:starts_at) { reservation_time(Time.zone.today, 18) }
  let(:ends_at) { reservation_time(Time.zone.today, 20) }

  describe ".call" do
    it "restaurant_master_idsが空の場合は何もしない" do
      reservation = build_reservation

      expect do
        described_class.call(
          reservation: reservation,
          restaurant_master_ids: []
        )
      end.not_to raise_error
    end

    it "存在しない予約席IDが含まれる場合はエラーにする" do
      reservation = build_reservation

      expect do
        described_class.call(
          reservation: reservation,
          restaurant_master_ids: [999_999]
        )
      end.to raise_error(ActiveRecord::RecordNotFound)
    end

    it "無効な予約席が含まれる場合はエラーにする" do
      inactive_restaurant_master =
        create(
          :restaurant_master,
          restaurant_master_type: table_type,
          active: false,
          created_by_staff: staff,
          updated_by_staff: staff
        )

      reservation = build_reservation

      expect do
        described_class.call(
          reservation: reservation,
          restaurant_master_ids: [inactive_restaurant_master.id]
        )
      end.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "同じ予約席で時間が重複する場合はエラーにする" do
      existing_reservation =
        create_reservation!(
          starts_at: reservation_time(Time.zone.today, 18),
          ends_at: reservation_time(Time.zone.today, 20)
        )

      existing_reservation.restaurant_masters << restaurant_master

      reservation =
        build_reservation(
          starts_at: reservation_time(Time.zone.today, 19),
          ends_at: reservation_time(Time.zone.today, 21)
        )

      expect do
        described_class.call(
          reservation: reservation,
          restaurant_master_ids: [restaurant_master.id]
        )
      end.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "同じ予約席でも時間が重複しない場合はエラーにしない" do
      existing_reservation =
        create_reservation!(
          starts_at: reservation_time(Time.zone.today, 18),
          ends_at: reservation_time(Time.zone.today, 20)
        )

      existing_reservation.restaurant_masters << restaurant_master

      reservation =
        build_reservation(
          starts_at: reservation_time(Time.zone.today, 20),
          ends_at: reservation_time(Time.zone.today, 22)
        )

      expect do
        described_class.call(
          reservation: reservation,
          restaurant_master_ids: [restaurant_master.id]
        )
      end.not_to raise_error
    end

    it "違う予約席であれば同じ時間でもエラーにしない" do
      existing_reservation =
        create_reservation!(
          starts_at: reservation_time(Time.zone.today, 18),
          ends_at: reservation_time(Time.zone.today, 20)
        )

      existing_reservation.restaurant_masters << restaurant_master

      reservation =
        build_reservation(
          starts_at: reservation_time(Time.zone.today, 18),
          ends_at: reservation_time(Time.zone.today, 20)
        )

      expect do
        described_class.call(
          reservation: reservation,
          restaurant_master_ids: [another_restaurant_master.id]
        )
      end.not_to raise_error
    end

    it "キャンセル済み予約は重複対象にしない" do
      canceled_reservation =
        create_reservation!(
          starts_at: reservation_time(Time.zone.today, 18),
          ends_at: reservation_time(Time.zone.today, 20),
          canceled_at: Time.current
        )

      canceled_reservation.restaurant_masters << restaurant_master

      reservation =
        build_reservation(
          starts_at: reservation_time(Time.zone.today, 18),
          ends_at: reservation_time(Time.zone.today, 20)
        )

      expect do
        described_class.call(
          reservation: reservation,
          restaurant_master_ids: [restaurant_master.id]
        )
      end.not_to raise_error
    end

    it "更新時は自分自身の予約を重複対象にしない" do
      reservation =
        create_reservation!(
          starts_at: reservation_time(Time.zone.today, 18),
          ends_at: reservation_time(Time.zone.today, 20)
        )

      reservation.restaurant_masters << restaurant_master

      expect do
        described_class.call(
          reservation: reservation,
          restaurant_master_ids: [restaurant_master.id]
        )
      end.not_to raise_error
    end
  end

  private
  # 予約を生成するヘルパーメソッド
  def build_reservation(attributes = {})
    Reservation.new(
      base_reservation_attributes.merge(attributes)
    )
  end

  # 予約日時を生成するヘルパーメソッド
  def create_reservation!(attributes = {})
    Reservation.create!(
      base_reservation_attributes.merge(attributes)
    )
  end

  # 予約の基本属性を返すヘルパーメソッド
  def base_reservation_attributes
    {
      reservation_name: "山田 太郎",
      reservation_phone_number: "09011112222",
      starts_at: starts_at,
      ends_at: ends_at,
      guest_count: 2,
      requested_restaurant_master_type: table_type,
      reservation_status: confirmed_status,
      created_by_staff: staff,
      updated_by_staff: staff
    }
  end

  # 予約日時を生成するヘルパーメソッド
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