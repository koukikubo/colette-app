require "rails_helper"

RSpec.describe RestaurantTable, type: :model do
  let(:restaurant_table_type_master) do
    create(
      :standard_master,
      system_key: "restaurant_table_type",
      name: "予約席種",
      active: true
    )
  end

  let(:table_type) do
    create(
      :standard_list_master,
      standard_master: restaurant_table_type_master,
      code: "T",
      label: "テーブル席",
      active: true
    )
  end

  let(:staff) do
    create(:staff)
  end

  def build_restaurant_table(attributes = {})
    build(
      :restaurant_table,
      {
        restaurant_table_type: table_type,
        created_by_staff: staff,
        updated_by_staff: staff
      }.merge(attributes)
    )
  end

  describe "バリデーション" do
    it "有効な属性の場合は登録できる" do
      restaurant_table = build_restaurant_table

      expect(restaurant_table).to be_valid
    end

    it "席名がない場合は無効である" do
      restaurant_table =
        build_restaurant_table(name: nil)

      expect(restaurant_table).not_to be_valid
      expect(restaurant_table.errors[:name]).to be_present
    end

    it "席名が空白の場合は無効である" do
      restaurant_table =
        build_restaurant_table(name: "   ")

      expect(restaurant_table).not_to be_valid
      expect(restaurant_table.errors[:name]).to be_present
    end

    it "定員がない場合は無効である" do
      restaurant_table =
        build_restaurant_table(capacity: nil)

      expect(restaurant_table).not_to be_valid
      expect(restaurant_table.errors[:capacity]).to be_present
    end

    it "定員が0の場合は無効である" do
      restaurant_table =
        build_restaurant_table(capacity: 0)

      expect(restaurant_table).not_to be_valid
      expect(restaurant_table.errors[:capacity]).to be_present
    end

    it "定員が負数の場合は無効である" do
      restaurant_table =
        build_restaurant_table(capacity: -1)

      expect(restaurant_table).not_to be_valid
      expect(restaurant_table.errors[:capacity]).to be_present
    end

    it "表示順が負数の場合は無効である" do
      restaurant_table =
        build_restaurant_table(position: -1)

      expect(restaurant_table).not_to be_valid
      expect(restaurant_table.errors[:position]).to be_present
    end

    it "連番が0の場合は無効である" do
      restaurant_table =
        build_restaurant_table(sequence_number: 0)

      expect(restaurant_table).not_to be_valid

      expect(
        restaurant_table.errors[:sequence_number]
      ).to be_present
    end

    it "席コードがない場合は無効である" do
      restaurant_table =
        build_restaurant_table(code: nil)

      expect(restaurant_table).not_to be_valid
      expect(restaurant_table.errors[:code]).to be_present
    end

    it "席コードが不正な形式の場合は無効である" do
      restaurant_table =
        build_restaurant_table(code: "table-01")

      expect(restaurant_table).not_to be_valid
      expect(restaurant_table.errors[:code]).to be_present
    end

    it "席コードが重複する場合は無効である" do
      create(
        :restaurant_table,
        restaurant_table_type: table_type,
        created_by_staff: staff,
        updated_by_staff: staff,
        code: "T01",
        sequence_number: 1
      )

      duplicated_table =
        build_restaurant_table(
          code: "T01",
          sequence_number: 2
        )

      expect(duplicated_table).not_to be_valid
      expect(duplicated_table.errors[:code]).to be_present
    end

    it "同じ席種内で連番が重複する場合は無効である" do
      create(
        :restaurant_table,
        restaurant_table_type: table_type,
        created_by_staff: staff,
        updated_by_staff: staff,
        code: "T01",
        sequence_number: 1
      )

      duplicated_table =
        build_restaurant_table(
          code: "T02",
          sequence_number: 1
        )

      expect(duplicated_table).not_to be_valid

      expect(
        duplicated_table.errors[:sequence_number]
      ).to be_present
    end

    it "異なる席種であれば同じ連番を使用できる" do
      counter_type =
        create(
          :standard_list_master,
          standard_master:
            restaurant_table_type_master,
          code: "C",
          label: "カウンター席",
          active: true
        )

      create(
        :restaurant_table,
        restaurant_table_type: table_type,
        created_by_staff: staff,
        updated_by_staff: staff,
        code: "T01",
        sequence_number: 1
      )

      counter_table =
        build_restaurant_table(
          restaurant_table_type: counter_type,
          code: "C01",
          sequence_number: 1
        )

      expect(counter_table).to be_valid
    end
  end

  describe "スコープ" do
    describe ".active" do
      it "有効な席だけを取得する" do
        active_table =
          create(
            :restaurant_table,
            restaurant_table_type: table_type,
            created_by_staff: staff,
            updated_by_staff: staff,
            active: true
          )

        inactive_table =
          create(
            :restaurant_table,
            restaurant_table_type: table_type,
            created_by_staff: staff,
            updated_by_staff: staff,
            active: false
          )

        expect(described_class.active)
          .to include(active_table)

        expect(described_class.active)
          .not_to include(inactive_table)
      end
    end

    describe ".ordered" do
      it "表示順とIDの順で取得する" do
        third_table =
          create(
            :restaurant_table,
            restaurant_table_type: table_type,
            created_by_staff: staff,
            updated_by_staff: staff,
            position: 30
          )

        first_table =
          create(
            :restaurant_table,
            restaurant_table_type: table_type,
            created_by_staff: staff,
            updated_by_staff: staff,
            position: 10
          )

        second_table =
          create(
            :restaurant_table,
            restaurant_table_type: table_type,
            created_by_staff: staff,
            updated_by_staff: staff,
            position: 20
          )

        expect(described_class.ordered).to eq(
          [
            first_table,
            second_table,
            third_table
          ]
        )
      end
    end
  end
end