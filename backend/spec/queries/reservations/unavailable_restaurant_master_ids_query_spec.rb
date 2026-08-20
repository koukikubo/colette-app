require "rails_helper"

RSpec.describe Reservations::UnavailableRestaurantMasterIdsQuery do
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
      standard_master: restaurant_master_type_master
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
      standard_master: reservation_status_master
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

  let!(:another_restaurant_master) do
    create(
      :restaurant_master,
      restaurant_master_type: table_type,
      created_by_staff: staff,
      updated_by_staff: staff
    )
  end

  let(:base_time) do
    Time.zone.local(2026, 8, 20, 18, 0)
  end

  def create_reservation(
    starts_at:,
    ends_at:,
    canceled_at: nil
  )
    create(
      :reservation,
      starts_at: starts_at,
      ends_at: ends_at,
      requested_restaurant_master_type: table_type,
      reservation_status: confirmed_status,
      created_by_staff: staff,
      updated_by_staff: staff,
      canceled_at: canceled_at
    )
  end

  describe ".call" do
    context "予約時間が重複している場合" do
      it "使用中の実テーブルIDを返す" do
        reservation =
          create_reservation(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )

        result =
          described_class.call(
            starts_at: base_time + 30.minutes,
            ends_at: base_time + 90.minutes
          )

        expect(result).to eq([ restaurant_master.id ])
      end
    end

    context "予約時間が重複していない場合" do
      it "実テーブルIDを返さない" do
        reservation =
          create_reservation(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )

        result =
          described_class.call(
            starts_at: base_time + 2.hours,
            ends_at: base_time + 3.hours
          )

        expect(result).to eq([])
      end
    end

    context "前の予約の終了時刻と次の予約の開始時刻が同じ場合" do
      it "時間重複として扱わない" do
        reservation =
          create_reservation(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )

        result =
          described_class.call(
            starts_at: base_time + 2.hours,
            ends_at: base_time + 3.hours
          )

        expect(result).to eq([])
      end
    end

    context "キャンセル済み予約の場合" do
      it "使用中の実テーブルとして扱わない" do
        reservation =
          create_reservation(
            starts_at: base_time,
            ends_at: base_time + 2.hours,
            canceled_at: base_time
          )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )

        result =
          described_class.call(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        expect(result).to eq([])
      end
    end

    context "excluded_reservation_idを指定した場合" do
      it "対象予約自身を除外する" do
        reservation =
          create_reservation(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )

        result =
          described_class.call(
            starts_at: base_time,
            ends_at: base_time + 2.hours,
            excluded_reservation_id: reservation.id
          )

        expect(result).to eq([])
      end
    end

    context "restaurant_master_idsを指定した場合" do
      it "指定した実テーブルだけを検索対象にする" do
        reservation =
          create_reservation(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: another_restaurant_master
        )

        result =
          described_class.call(
            starts_at: base_time,
            ends_at: base_time + 2.hours,
            restaurant_master_ids: [
              restaurant_master.id
            ]
          )

        expect(result).to eq([ restaurant_master.id ])
      end
    end

    context "restaurant_master_idsが空配列の場合" do
      it "検索対象なしとして空配列を返す" do
        reservation =
          create_reservation(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )

        result =
          described_class.call(
            starts_at: base_time,
            ends_at: base_time + 2.hours,
            restaurant_master_ids: []
          )

        expect(result).to eq([])
      end
    end

    context "同じ実テーブルが複数の重複予約で使用されている場合" do
      it "実テーブルIDを重複せず返す" do
        first_reservation =
          create_reservation(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        second_reservation =
          create_reservation(
            starts_at: base_time + 30.minutes,
            ends_at: base_time + 150.minutes
          )

        create(
          :reservation_table,
          reservation: first_reservation,
          restaurant_master: restaurant_master
        )

        create(
          :reservation_table,
          reservation: second_reservation,
          restaurant_master: restaurant_master
        )

        result =
          described_class.call(
            starts_at: base_time + 1.hour,
            ends_at: base_time + 90.minutes
          )

        expect(result).to eq([ restaurant_master.id ])
      end
    end

    context "複数の実テーブルが使用中の場合" do
      it "実テーブルIDを昇順で返す" do
        reservation =
          create_reservation(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: another_restaurant_master
        )

        create(
          :reservation_table,
          reservation: reservation,
          restaurant_master: restaurant_master
        )

        result =
          described_class.call(
            starts_at: base_time,
            ends_at: base_time + 2.hours
          )

        expect(result).to eq(
          [
            restaurant_master.id,
            another_restaurant_master.id
          ].sort
        )
      end
    end
  end
end
