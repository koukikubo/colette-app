require "rails_helper"

RSpec.describe Reservations::CreateService do
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

  let!(:confirmed_status) do
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

  let(:starts_at) { reservation_time(Time.zone.today, 18) }
  let(:ends_at) { reservation_time(Time.zone.today, 20) }

  let(:base_attributes) do
    {
      reservation_name: "山田 太郎",
      reservation_phone_number: "09011112222",
      starts_at: starts_at,
      ends_at: ends_at,
      guest_count: 2,
      requested_restaurant_master_type_id: table_type.id
    }
  end

  describe ".call" do
    it "一見客の予約を作成できる" do
      reservation =
        described_class.call(
          attributes: base_attributes,
          current_staff: staff
        )

      expect(reservation).to be_persisted
      expect(reservation.reservation_name).to eq("山田 太郎")
      expect(reservation.reservation_phone_number).to eq("09011112222")
      expect(reservation.customer).to be_nil
    end

    it "予約ステータスにconfirmedを自動設定する" do
      reservation =
        described_class.call(
          attributes: base_attributes,
          current_staff: staff
        )

      expect(reservation.reservation_status).to eq(confirmed_status)
    end

    it "作成者と更新者にcurrent_staffを設定する" do
      reservation =
        described_class.call(
          attributes: base_attributes,
          current_staff: staff
        )

      expect(reservation.created_by_staff).to eq(staff)
      expect(reservation.updated_by_staff).to eq(staff)
    end

    it "restaurant_master_idsがある場合、実テーブルを割り当てる" do
      reservation =
        described_class.call(
          attributes: base_attributes.merge(
            restaurant_master_ids: [restaurant_master.id]
          ),
          current_staff: staff
        )

      expect(reservation.restaurant_masters).to contain_exactly(restaurant_master)
    end

    it "restaurant_master_idsがない場合、実テーブルを割り当てない" do
      reservation =
        described_class.call(
          attributes: base_attributes,
          current_staff: staff
        )

      expect(reservation.restaurant_masters).to be_empty
    end

    it "既存顧客を選択した場合、顧客名を予約名に反映する" do
      customer =
        create(
          :customer,
          name: "久保 光輝",
          phone_number: "09012345678"
        )

      reservation =
        described_class.call(
          attributes: base_attributes.merge(
            customer_id: customer.id,
            reservation_name: "入力された名前",
            reservation_phone_number: "08099998888"
          ),
          current_staff: staff
        )

      expect(reservation.customer).to eq(customer)
      expect(reservation.reservation_name).to eq("久保 光輝")
      expect(reservation.reservation_phone_number).to eq("08099998888")
    end

    it "既存顧客を選択し、電話番号が空の場合は顧客の電話番号を反映する" do
      customer =
        create(
          :customer,
          name: "久保 光輝",
          phone_number: "09012345678"
        )

      reservation =
        described_class.call(
          attributes: base_attributes.merge(
            customer_id: customer.id,
            reservation_phone_number: ""
          ),
          current_staff: staff
        )

      expect(reservation.reservation_phone_number).to eq("09012345678")
    end

    it "同じ実テーブルで時間が重複する場合は作成できない" do
      existing_reservation =
        Reservation.create!(
          reservation_name: "既存予約",
          reservation_phone_number: "09022223333",
          starts_at: starts_at,
          ends_at: ends_at,
          guest_count: 2,
          requested_restaurant_master_type: table_type,
          reservation_status: confirmed_status,
          created_by_staff: staff,
          updated_by_staff: staff
        )

      existing_reservation.restaurant_masters << restaurant_master

      expect do
        described_class.call(
          attributes: base_attributes.merge(
            restaurant_master_ids: [restaurant_master.id]
          ),
          current_staff: staff
        )
      end.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "作成に失敗した場合、予約は保存されない" do
      expect do
        described_class.call(
          attributes: base_attributes.merge(
            reservation_name: nil,
            restaurant_master_ids: [restaurant_master.id]
          ),
          current_staff: staff
        )
      rescue ActiveRecord::RecordInvalid
        nil
      end.not_to change(Reservation, :count)
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