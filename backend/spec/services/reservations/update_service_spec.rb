require "rails_helper"

RSpec.describe Reservations::UpdateService do
  let(:staff) { create(:staff) }
  let(:other_staff) { create(:staff) }

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

  let(:starts_at) { reservation_time(Time.zone.today, 18) }
  let(:ends_at) { reservation_time(Time.zone.today, 20) }

  let(:reservation) do
    Reservation.create!(
      reservation_name: "更新前",
      reservation_phone_number: "09011112222",
      starts_at: starts_at,
      ends_at: ends_at,
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
      capacity: 4,
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  let(:another_restaurant_master) do
    create(
      :restaurant_master,
      restaurant_master_type: table_type,
      capacity: 4,
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  describe ".call" do
    it "予約情報を更新できる" do
      updated_reservation =
        described_class.call(
          reservation: reservation,
          attributes: {
            reservation_name: "更新後",
            reservation_phone_number: "09099998888",
            starts_at: reservation_time(Time.zone.today, 19),
            ends_at: reservation_time(Time.zone.today, 21),
            guest_count: 4,
            requested_restaurant_master_type_id: table_type.id,
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )

      expect(updated_reservation.reservation_name).to eq("更新後")
      expect(updated_reservation.reservation_phone_number).to eq("09099998888")
      expect(updated_reservation.guest_count).to eq(4)
      expect(updated_reservation.updated_by_staff).to eq(other_staff)
    end

    it "created_by_staffは変更しない" do
      updated_reservation =
        described_class.call(
          reservation: reservation,
          attributes: {
            reservation_name: "更新後",
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )

      expect(updated_reservation.created_by_staff).to eq(staff)
      expect(updated_reservation.updated_by_staff).to eq(other_staff)
    end

    it "既存顧客を選択した場合、顧客名を予約名に反映する" do
      customer =
        create(
          :customer,
          name: "久保 光輝",
          phone_number: "09012345678"
        )

      updated_reservation =
        described_class.call(
          reservation: reservation,
          attributes: {
            customer_id: customer.id,
            reservation_name: "入力された名前",
            reservation_phone_number: "08099998888",
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )

      expect(updated_reservation.customer).to eq(customer)
      expect(updated_reservation.reservation_name).to eq("久保 光輝")
      expect(updated_reservation.reservation_phone_number).to eq("08099998888")
    end

    it "既存顧客を選択し、電話番号が空の場合は顧客の電話番号を反映する" do
      customer =
        create(
          :customer,
          name: "久保 光輝",
          phone_number: "09012345678"
        )

      updated_reservation =
        described_class.call(
          reservation: reservation,
          attributes: {
            customer_id: customer.id,
            reservation_phone_number: "",
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )

      expect(updated_reservation.reservation_phone_number).to eq("09012345678")
    end

    it "restaurant_master_idsを送った場合、実テーブル割当を更新する" do
      reservation.restaurant_masters << restaurant_master

      updated_reservation =
        described_class.call(
          reservation: reservation,
          attributes: {
            lock_version: reservation.lock_version,
            restaurant_master_ids: [ another_restaurant_master.id ]
          },
          current_staff: other_staff
        )

      expect(updated_reservation.restaurant_masters)
        .to contain_exactly(another_restaurant_master)
    end

    it "複数の実テーブルで予約人数分の定員を確保できる場合は更新できる" do
      updated_reservation =
        described_class.call(
          reservation: reservation,
          attributes: {
            guest_count: 8,
            restaurant_master_ids: [
              restaurant_master.id,
              another_restaurant_master.id
            ],
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )

      expect(updated_reservation.guest_count).to eq(8)
      expect(updated_reservation.restaurant_masters)
        .to contain_exactly(
          restaurant_master,
          another_restaurant_master
        )
    end

    it "実テーブルの合計定員が予約人数を下回る場合は更新できない" do
      expect do
        described_class.call(
          reservation: reservation,
          attributes: {
            guest_count: 8,
            restaurant_master_ids: [ restaurant_master.id ],
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )
      end.to raise_error(ActiveRecord::RecordInvalid) { |error|
        expect(
          error.record.errors.details[:restaurant_master_ids]
        ).to include(error: :insufficient_capacity)
      }

      reservation.reload

      expect(reservation.guest_count).to eq(2)
      expect(reservation.restaurant_masters).to be_empty
    end

    it "restaurant_master_idsを送らない場合、実テーブル割当を変更しない" do
      reservation.restaurant_masters << restaurant_master

      updated_reservation =
        described_class.call(
          reservation: reservation,
          attributes: {
            reservation_name: "更新後",
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )

      expect(updated_reservation.restaurant_masters)
        .to contain_exactly(restaurant_master)
    end

    it "restaurant_master_idsに空配列を送ると、実テーブル割当を解除する" do
      reservation.restaurant_masters << restaurant_master

      updated_reservation =
        described_class.call(
          reservation: reservation,
          attributes: {
            lock_version: reservation.lock_version,
            restaurant_master_ids: []
          },
          current_staff: other_staff
        )

      expect(updated_reservation.restaurant_masters).to be_empty
    end

    it "同じ実テーブルで他予約と時間が重複する場合は更新できない" do
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
        described_class.call(
          reservation: reservation,
          attributes: {
            starts_at: reservation_time(Time.zone.today, 19),
            ends_at: reservation_time(Time.zone.today, 21),
            lock_version: reservation.lock_version,
            restaurant_master_ids: [ restaurant_master.id ]
          },
          current_staff: other_staff
        )
      end.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "割り当て済みの実テーブルが後から無効になっても割り当てを維持できる" do
      reservation.restaurant_masters << restaurant_master

      # 予約へ割り当てた後に、席マスタが運用上無効化された状況を再現する。
      restaurant_master.update!(active: false)

      updated_reservation =
        described_class.call(
          reservation: reservation,
          attributes: {
            reservation_name: "既存席を維持",
            restaurant_master_ids: [ restaurant_master.id ],
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )

      expect(updated_reservation.reservation_name).to eq("既存席を維持")
      expect(updated_reservation.restaurant_masters)
        .to contain_exactly(restaurant_master)
    end

    it "無効な実テーブルを新しく割り当てることはできない" do
      inactive_restaurant_master =
        create(
          :restaurant_master,
          restaurant_master_type: table_type,
          capacity: 4,
          active: false,
          created_by_staff: staff,
          updated_by_staff: staff
        )

      expect do
        described_class.call(
          reservation: reservation,
          attributes: {
            restaurant_master_ids: [
              inactive_restaurant_master.id
            ],
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )
      end.to raise_error(ActiveRecord::RecordInvalid) { |error|
        expect(error.record.errors[:base])
          .to include("無効な予約席が含まれています")
      }
    end

    it "自分自身の実テーブル割当は二重予約扱いにしない" do
      reservation.restaurant_masters << restaurant_master

      expect do
        described_class.call(
          reservation: reservation,
          attributes: {
            reservation_name: "更新後",
            lock_version: reservation.lock_version,
            restaurant_master_ids: [ restaurant_master.id ]
          },
          current_staff: other_staff
        )
      end.not_to raise_error
    end

    it "入力値が不正な場合は更新できない" do
      expect do
        described_class.call(
          reservation: reservation,
          attributes: {
            reservation_name: nil,
            lock_version: reservation.lock_version
          },
          current_staff: other_staff
        )
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
