require "rails_helper"

RSpec.describe Reservation, type: :model do
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

  let(:starts_at) { reservation_time(Time.zone.today, 18) }
  let(:ends_at) { reservation_time(Time.zone.today, 20) }

  let(:valid_attributes) do
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

  describe "validations" do
    it "有効な属性の場合は有効である" do
      reservation = described_class.new(valid_attributes)

      expect(reservation).to be_valid
    end

    it "customerは任意である" do
      reservation = described_class.new(
        valid_attributes.merge(customer: nil)
      )

      expect(reservation).to be_valid
    end

    it "reservation_nameが必須である" do
      reservation = described_class.new(
        valid_attributes.merge(reservation_name: nil)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:reservation_name]).to be_present
    end

    it "reservation_nameは50文字以内である" do
      reservation = described_class.new(
        valid_attributes.merge(reservation_name: "あ" * 51)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:reservation_name]).to be_present
    end

    it "reservation_phone_numberが必須である" do
      reservation = described_class.new(
        valid_attributes.merge(reservation_phone_number: nil)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:reservation_phone_number]).to be_present
    end

    it "reservation_phone_numberは20文字以内である" do
      reservation = described_class.new(
        valid_attributes.merge(reservation_phone_number: "1" * 21)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:reservation_phone_number]).to be_present
    end

    it "starts_atが必須である" do
      reservation = described_class.new(
        valid_attributes.merge(starts_at: nil)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:starts_at]).to be_present
    end

    it "ends_atが必須である" do
      reservation = described_class.new(
        valid_attributes.merge(ends_at: nil)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:ends_at]).to be_present
    end

    it "guest_countが必須である" do
      reservation = described_class.new(
        valid_attributes.merge(guest_count: nil)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:guest_count]).to be_present
    end

    it "guest_countは1以上である" do
      reservation = described_class.new(
        valid_attributes.merge(guest_count: 0)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:guest_count]).to be_present
    end

    it "guest_countは整数である" do
      reservation = described_class.new(
        valid_attributes.merge(guest_count: 1.5)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:guest_count]).to be_present
    end

    it "ends_atはstarts_atより後である必要がある" do
      reservation = described_class.new(
        valid_attributes.merge(
          starts_at: reservation_time(Time.zone.today, 20),
          ends_at: reservation_time(Time.zone.today, 18)
        )
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:ends_at]).to be_present
    end

    it "ends_atとstarts_atが同じ場合は無効である" do
      same_time = reservation_time(Time.zone.today, 18)

      reservation = described_class.new(
        valid_attributes.merge(
          starts_at: same_time,
          ends_at: same_time
        )
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:ends_at]).to be_present
    end

    describe "営業時間のバリデーション" do
      it "17:00開始の予約は有効である" do
        reservation = described_class.new(
          valid_attributes.merge(
            starts_at: reservation_time(Time.zone.today, 17),
            ends_at: reservation_time(Time.zone.today, 19)
          )
        )

        expect(reservation).to be_valid
      end

      it "21:00開始かつ24:00終了の予約は有効である" do
        reservation = described_class.new(
          valid_attributes.merge(
            starts_at: reservation_time(Time.zone.today, 21),
            ends_at: reservation_time(Time.zone.tomorrow, 0)
          )
        )

        expect(reservation).to be_valid
      end

      it "17:00より前に開始する予約は無効である" do
        reservation = described_class.new(
          valid_attributes.merge(
            starts_at: reservation_time(Time.zone.today, 16, 59),
            ends_at: reservation_time(Time.zone.today, 19)
          )
        )

        expect(reservation).to be_invalid
        expect(
          reservation.errors.details[:starts_at]
        ).to include(error: :outside_business_hours)
      end

      it "21:00より後に開始する予約は無効である" do
        reservation = described_class.new(
          valid_attributes.merge(
            starts_at: reservation_time(Time.zone.today, 21, 1),
            ends_at: reservation_time(Time.zone.today, 23)
          )
        )

        expect(reservation).to be_invalid
        expect(
          reservation.errors.details[:starts_at]
        ).to include(error: :outside_business_hours)
      end

      it "22:00開始の予約は無効である" do
        reservation = described_class.new(
          valid_attributes.merge(
            starts_at: reservation_time(Time.zone.today, 22),
            ends_at: reservation_time(Time.zone.tomorrow, 0)
          )
        )

        expect(reservation).to be_invalid
        expect(
          reservation.errors.details[:starts_at]
        ).to include(error: :outside_business_hours)
      end

      it "24:00より後に終了する予約は無効である" do
        reservation = described_class.new(
          valid_attributes.merge(
            starts_at: reservation_time(Time.zone.today, 21),
            ends_at: reservation_time(Time.zone.tomorrow, 0, 1)
          )
        )

        expect(reservation).to be_invalid
        expect(
          reservation.errors.details[:ends_at]
        ).to include(error: :outside_business_hours)
      end
    end

    it "requested_restaurant_master_typeが必須である" do
      reservation = described_class.new(
        valid_attributes.merge(requested_restaurant_master_type: nil)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:requested_restaurant_master_type]).to be_present
    end

    it "reservation_statusが必須である" do
      reservation = described_class.new(
        valid_attributes.merge(reservation_status: nil)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:reservation_status]).to be_present
    end

    it "created_by_staffが必須である" do
      reservation = described_class.new(
        valid_attributes.merge(created_by_staff: nil)
      )

      expect(reservation).to be_invalid
      expect(reservation.errors[:created_by_staff]).to be_present
    end

    it "updated_by_staffが必須である" do
      reservation = described_class.new(
        valid_attributes.merge(updated_by_staff: nil)
      )
      expect(reservation).to be_invalid
      expect(reservation.errors[:updated_by_staff]).to be_present
    end

    it "reservation_statusに別カテゴリの選択肢は指定できない" do
      reservation = described_class.new(
        valid_attributes.merge(
          reservation_status: table_type
        )
      )

      expect(reservation).to be_invalid

      expect(
        reservation.errors.details[:reservation_status]
      ).to include(error: :invalid_category)
    end
  end

  describe "同一顧客の時間重複バリデーション" do
  let(:customer) { create(:customer) }

  let!(:existing_reservation) do
    create_reservation!(
      customer: customer,
      starts_at: reservation_time(Time.zone.today, 18),
      ends_at: reservation_time(Time.zone.today, 20)
    )
  end

  it "同一顧客の予約時間が重複する場合は無効である" do
    reservation =
      described_class.new(
        valid_attributes.merge(
          customer: customer,
          starts_at: reservation_time(Time.zone.today, 19),
          ends_at: reservation_time(Time.zone.today, 21)
        )
      )

    expect(reservation).to be_invalid

    expect(
      reservation.errors.details[:customer_id]
    ).to include(error: :overlapping_reservation)

    expect(
      reservation.errors.full_messages
    ).to include(
      "顧客は同じ時間帯に別の予約が登録されています"
    )
  end

  it "同一顧客でも既存予約の終了時刻から開始する場合は有効である" do
    reservation =
      described_class.new(
        valid_attributes.merge(
          customer: customer,
          starts_at: reservation_time(Time.zone.today, 20),
          ends_at: reservation_time(Time.zone.today, 21)
        )
      )

    expect(reservation).to be_valid
  end

  it "別顧客なら同じ時間帯でも有効である" do
  another_customer = create(:customer)

  reservation =
    described_class.new(
      valid_attributes.merge(
        customer: another_customer,
        starts_at: reservation_time(Time.zone.today, 19),
        ends_at: reservation_time(Time.zone.today, 21)
      )
    )

  expect(reservation).to be_valid
end

it "既存予約がキャンセル済みなら同じ顧客・時間帯でも有効である" do
    existing_reservation.update!(canceled_at: Time.current)

    reservation =
      described_class.new(
        valid_attributes.merge(
          customer: customer,
          starts_at: reservation_time(Time.zone.today, 19),
          ends_at: reservation_time(Time.zone.today, 21)
        )
      )

    expect(reservation).to be_valid
  end

  it "顧客未選択なら時間が重複していても有効である" do
    reservation =
      described_class.new(
        valid_attributes.merge(
          customer: nil,
          starts_at: reservation_time(Time.zone.today, 19),
          ends_at: reservation_time(Time.zone.today, 21)
        )
      )

    expect(reservation).to be_valid
  end

  it "更新時は自分自身を重複対象にしない" do
    existing_reservation.reservation_name = "更新後の予約名"

    expect(existing_reservation).to be_valid
  end

  it "更新後の時間が同一顧客の別予約と重複する場合は無効である" do
    target_reservation =
      create_reservation!(
        customer: customer,
        starts_at: reservation_time(Time.zone.today, 20),
        ends_at: reservation_time(Time.zone.today, 21)
      )

    target_reservation.assign_attributes(
      starts_at: reservation_time(Time.zone.today, 19),
      ends_at: reservation_time(Time.zone.today, 21)
    )

    expect(target_reservation).to be_invalid
    expect(
      target_reservation.errors.details[:customer_id]
    ).to include(error: :overlapping_reservation)
  end
end

  describe "scopes" do
    describe ".ordered" do
      it "開始日時とIDの昇順で取得する" do
        later_reservation =
          create_reservation!(
            starts_at: reservation_time(Time.zone.today, 20),
            ends_at: reservation_time(Time.zone.today, 22)
          )

        earlier_reservation =
          create_reservation!(
            starts_at: reservation_time(Time.zone.today, 18),
            ends_at: reservation_time(Time.zone.today, 19)
          )

        expect(described_class.ordered).to eq(
          [
            earlier_reservation,
            later_reservation
          ]
        )
      end
    end

    describe ".on_date" do
      it "指定日の予約のみ取得する" do
        today_reservation =
          create_reservation!(
            starts_at: reservation_time(Time.zone.today, 18),
            ends_at: reservation_time(Time.zone.today, 20)
          )

        tomorrow_reservation =
          create_reservation!(
            starts_at: reservation_time(Time.zone.tomorrow, 18),
            ends_at: reservation_time(Time.zone.tomorrow, 20)
          )

        reservations = described_class.on_date(Time.zone.today)

        expect(reservations).to include(today_reservation)
        expect(reservations).not_to include(tomorrow_reservation)
      end
    end

    describe ".active" do
      it "キャンセルされていない予約のみ取得する" do
        active_reservation = create_reservation!

        canceled_reservation =
          create_reservation!(
            reservation_name: "キャンセル予約",
            canceled_at: Time.current
          )

        expect(described_class.active).to include(active_reservation)
        expect(described_class.active).not_to include(canceled_reservation)
      end
    end

    describe ".canceled" do
      it "キャンセル済みの予約のみ取得する" do
        active_reservation = create_reservation!

        canceled_reservation =
          create_reservation!(
            reservation_name: "キャンセル予約",
            canceled_at: Time.current
          )

        expect(described_class.canceled).to include(canceled_reservation)
        expect(described_class.canceled).not_to include(active_reservation)
      end
    end

    describe ".search_by_keyword" do
      it "予約名で検索できる" do
        target_reservation =
          create_reservation!(reservation_name: "久保 光輝")

        other_reservation =
          create_reservation!(reservation_name: "山田 太郎")

        results = described_class.search_by_keyword("久保")

        expect(results).to include(target_reservation)
        expect(results).not_to include(other_reservation)
      end

      it "電話番号で検索できる" do
        target_reservation =
          create_reservation!(
            reservation_phone_number: "09012345678"
          )

        other_reservation =
          create_reservation!(
            reservation_phone_number: "08099998888"
          )

        results = described_class.search_by_keyword("09012345678")

        expect(results).to include(target_reservation)
        expect(results).not_to include(other_reservation)
      end

      it "空文字の場合は全件取得する" do
        first_reservation = create_reservation!(reservation_name: "予約1")
        second_reservation = create_reservation!(reservation_name: "予約2")

        results = described_class.search_by_keyword("")

        expect(results).to include(first_reservation, second_reservation)
      end
    end
  end

  private
  # 予約を作成するヘルパーメソッド
  def create_reservation!(attributes = {})
    described_class.create!(
      valid_attributes.merge(attributes)
    )
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
