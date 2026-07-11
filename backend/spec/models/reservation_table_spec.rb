require "rails_helper"

RSpec.describe ReservationTable, type: :model do
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

  let(:reservation) do
    Reservation.create!(
      reservation_name: "山田 太郎",
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

  let(:restaurant_master) do
    create(
      :restaurant_master,
      restaurant_master_type: table_type,
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  describe "associations" do
    it "reservationに属する" do
      reservation_table =
        described_class.new(
          reservation: reservation,
          restaurant_master: restaurant_master
        )

      expect(reservation_table.reservation).to eq(reservation)
    end

    it "restaurant_masterに属する" do
      reservation_table =
        described_class.new(
          reservation: reservation,
          restaurant_master: restaurant_master
        )

      expect(reservation_table.restaurant_master).to eq(restaurant_master)
    end
  end

  describe "validations" do
    it "reservationが必須である" do
      reservation_table =
        described_class.new(
          reservation: nil,
          restaurant_master: restaurant_master
        )

      expect(reservation_table).to be_invalid
      expect(reservation_table.errors[:reservation]).to be_present
    end

    it "restaurant_masterが必須である" do
      reservation_table =
        described_class.new(
          reservation: reservation,
          restaurant_master: nil
        )

      expect(reservation_table).to be_invalid
      expect(reservation_table.errors[:restaurant_master]).to be_present
    end
  end

  describe "database constraints" do
    it "同じ予約に同じ実テーブルを重複して割り当てできない" do
      described_class.create!(
        reservation: reservation,
        restaurant_master: restaurant_master
      )

      expect do
        described_class.create!(
          reservation: reservation,
          restaurant_master: restaurant_master
        )
      # reservationが新規作成の場合は、全ての既存予約を対象とする
      end.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  private

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