class AddSystemIdentifiersToStandardMasters < ActiveRecord::Migration[8.1]
  def change
    # 基本コードの用途をアプリケーションから識別する固定キー。
    # 例：restaurant_master_type
    add_column :standard_masters,
                :system_key,
                :string

    # 選択肢を機械的に識別する固定コード。
    # 予約席種ではT、C、Zなどを保存する。
    add_column :standard_list_masters,
                :code,
                :string

    add_index :standard_masters,
              :system_key,
              unique: true

    add_index :standard_list_masters,
              [:standard_master_id, :code],
              unique: true,
              name: "idx_standard_list_masters_master_and_code"
  end
end