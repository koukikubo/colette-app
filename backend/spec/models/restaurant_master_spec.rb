require "rails_helper"

RSpec.describe RestaurantMaster, type: :model do
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

  let(:staff) do
    create(:staff)
  end

  def build_restaurant_master(attributes = {})
    build(
      :restaurant_master,
      {
        restaurant_master_type: table_type,
        created_by_staff: staff,
        updated_by_staff: staff
      }.merge(attributes)
    )
  end

  describe "バリデーション" do
    it "有効な属性の場合は登録できる" do
      restaurant_master = build_restaurant_master

      expect(restaurant_master).to be_valid
    end

    it "席名がない場合は無効である" do
      restaurant_master =
        build_restaurant_master(name: nil)

      expect(restaurant_master).not_to be_valid
      expect(restaurant_master.errors[:name]).to be_present
    end

    it "席名が空白の場合は無効である" do
      restaurant_master =
        build_restaurant_master(name: "   ")

      expect(restaurant_master).not_to be_valid
      expect(restaurant_master.errors[:name]).to be_present
    end

    it "定員がない場合は無効である" do
      restaurant_master =
        build_restaurant_master(capacity: nil)

      expect(restaurant_master).not_to be_valid
      expect(restaurant_master.errors[:capacity]).to be_present
    end

    it "定員が0の場合は無効である" do
      restaurant_master =
        build_restaurant_master(capacity: 0)

      expect(restaurant_master).not_to be_valid
      expect(restaurant_master.errors[:capacity]).to be_present
    end

    it "定員が負数の場合は無効である" do
      restaurant_master =
        build_restaurant_master(capacity: -1)

      expect(restaurant_master).not_to be_valid
      expect(restaurant_master.errors[:capacity]).to be_present
    end

    it "表示順が負数の場合は無効である" do
      restaurant_master =
        build_restaurant_master(position: -1)

      expect(restaurant_master).not_to be_valid
      expect(restaurant_master.errors[:position]).to be_present
    end

    it "連番が0の場合は無効である" do
      restaurant_master =
        build_restaurant_master(sequence_number: 0)

      expect(restaurant_master).not_to be_valid

      expect(
        restaurant_master.errors[:sequence_number]
      ).to be_present
    end

    it "席コードがない場合は無効である" do
      restaurant_master =
        build_restaurant_master(code: nil)

      expect(restaurant_master).not_to be_valid
      expect(restaurant_master.errors[:code]).to be_present
    end

    it "席コードが不正な形式の場合は無効である" do
      restaurant_master =
        build_restaurant_master(code: "table-01")

      expect(restaurant_master).not_to be_valid
      expect(restaurant_master.errors[:code]).to be_present
    end

    it "席コードが重複する場合は無効である" do
      create(
        :restaurant_master,
        restaurant_master_type: table_type,
        created_by_staff: staff,
        updated_by_staff: staff,
        code: "T01",
        sequence_number: 1
      )

      duplicated_table =
        build_restaurant_master(
          code: "T01",
          sequence_number: 2
        )

      expect(duplicated_table).not_to be_valid
      expect(duplicated_table.errors[:code]).to be_present
    end

    it "同じ席種内で連番が重複する場合は無効である" do
      create(
        :restaurant_master,
        restaurant_master_type: table_type,
        created_by_staff: staff,
        updated_by_staff: staff,
        code: "T01",
        sequence_number: 1
      )

      duplicated_table =
        build_restaurant_master(
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
            restaurant_master_type_master,
          code: "C",
          label: "カウンター席",
          active: true
        )

      create(
        :restaurant_master,
        restaurant_master_type: table_type,
        created_by_staff: staff,
        updated_by_staff: staff,
        code: "T01",
        sequence_number: 1
      )

      counter_table =
        build_restaurant_master(
          restaurant_master_type: counter_type,
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
            :restaurant_master,
            restaurant_master_type: table_type,
            created_by_staff: staff,
            updated_by_staff: staff,
            active: true
          )

        inactive_table =
          create(
            :restaurant_master,
            restaurant_master_type: table_type,
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
            :restaurant_master,
            restaurant_master_type: table_type,
            created_by_staff: staff,
            updated_by_staff: staff,
            position: 30
          )

        first_table =
          create(
            :restaurant_master,
            restaurant_master_type: table_type,
            created_by_staff: staff,
            updated_by_staff: staff,
            position: 10
          )

        second_table =
          create(
            :restaurant_master,
            restaurant_master_type: table_type,
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