# backend/app/services/restaurant_tables/create_service.rb

module RestaurantTables
  class CreateService
    # 基本コードマスタから「予約席種」を特定するためのキー
    RESTAURANT_TABLE_TYPE_MASTER_KEY =
      "restaurant_table_type".freeze

    # Controllerから呼び出すためのクラスメソッド
    def self.call(attributes:, current_staff:)
      new(
        attributes: attributes,
        current_staff: current_staff
      ).call
    end

    def initialize(attributes:, current_staff:)
      # ActionController::Parametersを通常のHashへ変換し、
      # キーをSymbolへ統一する
      @attributes = attributes.to_h.symbolize_keys

      # ログイン中の担当者
      @current_staff = current_staff
    end

    def call
      RestaurantTable.transaction do
        # 対象の席種を取得し、同時登録を防ぐためにロックする
        table_type = lock_restaurant_table_type!

        # 席種ごとの次の連番を取得する
        sequence_number =
          next_sequence_number(table_type)

        # 席情報を保存し、保存したRestaurantTableを返す
        RestaurantTable.create!(
          editable_attributes.merge(
            restaurant_table_type: table_type,
            sequence_number: sequence_number,
            code: build_code(
              table_type: table_type,
              sequence_number: sequence_number
            ),
            created_by_staff: current_staff,
            updated_by_staff: current_staff
          )
        )
      end
    end

    private

    attr_reader :attributes, :current_staff

    # 指定された席種が、
    # 有効な「予約席種」の選択肢であることを確認してロックする
    def lock_restaurant_table_type!
      StandardListMaster
        .joins(:standard_master)
        .where(
          standard_masters: {
            system_key:
              RESTAURANT_TABLE_TYPE_MASTER_KEY,
            active: true
          }
        )
        .where(active: true)
        .lock
        .find(attributes[:restaurant_table_type_id])
    end

    # 同じ席種に登録されている最大連番へ1を加える
    def next_sequence_number(table_type)
      RestaurantTable
        .where(
          restaurant_table_type_id: table_type.id
        )
        .maximum(:sequence_number)
        .to_i + 1
    end

    # 席種コードと連番から席コードを生成する
    def build_code(table_type:, sequence_number:)
      format(
        "%s%02d",
        table_type.code,
        sequence_number
      )
    end

    # クライアントが編集できる属性だけを取り出す
    def editable_attributes
      attributes.slice(
        :name,
        :capacity,
        :active,
        :position,
        :memo
      )
    end
  end
end