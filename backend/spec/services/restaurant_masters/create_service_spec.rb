require "rails_helper"

RSpec.describe RestaurantMasters::CreateService do
  let(:staff) { create(:staff) }

  let(:restaurant_master_type_master) do
    create(
      :standard_master,
      system_key: "restaurant_master_type",
      name: "予約席種",
      active: true
    )
  end

  let(:table_type) do
    create(
      :standard_list_master,
      standard_master: restaurant_master_type_master,
      code: "T",
      label: "テーブル席",
      active: true
    )
  end

  let(:counter_type) do
    create(
      :standard_list_master,
      standard_master: restaurant_master_type_master,
      code: "C",
      label: "カウンター席",
      active: true
    )
  end

  let(:base_attributes) do
    {
      restaurant_master_type_id: table_type.id,
      name: "テーブル1",
      capacity: 4,
      active: true,
      position: 10,
      memo: "窓側"
    }
  end

  describe ".call" do
    it "席マスタを作成できる" do
      restaurant_master =
        described_class.call(
          attributes: base_attributes,
          current_staff: staff
        )

      expect(restaurant_master).to be_persisted
      expect(restaurant_master.name).to eq("テーブル1")
      expect(restaurant_master.capacity).to eq(4)
      expect(restaurant_master.active).to eq(true)
      expect(restaurant_master.position).to eq(10)
      expect(restaurant_master.memo).to eq("窓側")
    end

    it "作成者と更新者にcurrent_staffを設定する" do
      restaurant_master =
        described_class.call(
          attributes: base_attributes,
          current_staff: staff
        )

      expect(restaurant_master.created_by_staff).to eq(staff)
      expect(restaurant_master.updated_by_staff).to eq(staff)
    end

    it "同じ席種の最初の連番を1にする" do
      restaurant_master =
        described_class.call(
          attributes: base_attributes,
          current_staff: staff
        )

      expect(restaurant_master.sequence_number).to eq(1)
    end

    it "席種コードと連番からcodeを自動生成する" do
      restaurant_master =
        described_class.call(
          attributes: base_attributes,
          current_staff: staff
        )

      expect(restaurant_master.code).to eq("T01")
    end

    it "同じ席種の最大連番に1を加えて採番する" do
      create(
        :restaurant_master,
        restaurant_master_type: table_type,
        sequence_number: 1,
        code: "T01",
        created_by_staff: staff,
        updated_by_staff: staff
      )

      create(
        :restaurant_master,
        restaurant_master_type: table_type,
        sequence_number: 2,
        code: "T02",
        created_by_staff: staff,
        updated_by_staff: staff
      )

      restaurant_master =
        described_class.call(
          attributes: base_attributes.merge(name: "テーブル3"),
          current_staff: staff
        )

      expect(restaurant_master.sequence_number).to eq(3)
      expect(restaurant_master.code).to eq("T03")
    end

    it "席種ごとに連番を採番する" do
      create(
        :restaurant_master,
        restaurant_master_type: table_type,
        sequence_number: 1,
        code: "T01",
        created_by_staff: staff,
        updated_by_staff: staff
      )

      restaurant_master =
        described_class.call(
          attributes: base_attributes.merge(
            restaurant_master_type_id: counter_type.id,
            name: "カウンター1"
          ),
          current_staff: staff
        )

      expect(restaurant_master.sequence_number).to eq(1)
      expect(restaurant_master.code).to eq("C01")
    end

    it "クライアントから渡されたcodeやsequence_numberは使用しない" do
      restaurant_master =
        described_class.call(
          attributes: base_attributes.merge(
            code: "XXX99",
            sequence_number: 99
          ),
          current_staff: staff
        )

      expect(restaurant_master.sequence_number).to eq(1)
      expect(restaurant_master.code).to eq("T01")
    end

    it "無効な席種の場合は作成できない" do
      inactive_type =
        create(
          :standard_list_master,
          standard_master: restaurant_master_type_master,
          code: "X",
          label: "無効席種",
          active: false
        )

      expect do
        described_class.call(
          attributes: base_attributes.merge(
            restaurant_master_type_id: inactive_type.id
          ),
          current_staff: staff
        )
      end.to raise_error(ActiveRecord::RecordNotFound)
    end

    it "予約席種以外の基本コード選択肢では作成できない" do
      other_master =
        create(
          :standard_master,
          system_key: "reservation_status",
          name: "予約ステータス",
          active: true
        )

      other_list =
        create(
          :standard_list_master,
          standard_master: other_master,
          code: "confirmed",
          label: "予約確定",
          active: true
        )

      expect do
        described_class.call(
          attributes: base_attributes.merge(
            restaurant_master_type_id: other_list.id
          ),
          current_staff: staff
        )
      end.to raise_error(ActiveRecord::RecordNotFound)
    end

    it "入力値が不正な場合は作成できない" do
      expect do
        described_class.call(
          attributes: base_attributes.merge(name: nil),
          current_staff: staff
        )
      end.to raise_error(ActiveRecord::RecordInvalid)
    end
  end
end