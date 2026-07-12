class CreateRestaurantMasters < ActiveRecord::Migration[8.1]
  def change
    create_table :restaurant_masters do |t|
      # 席種を表す基本コードの選択肢を参照する。
      t.references :restaurant_master_type,
                    null: false,
                    foreign_key: {
                      to_table: :standard_list_masters
                    },
                    index: false

      # 同じ席種内での連番。
      # テーブル席なら1、2、3、カウンター席なら1、2、3のように管理する。
      # code生成時にT01、T02、C01などの数値部分として使用する。
      t.integer :sequence_number,
                null: false

      # 予約や画面表示で使用する変更不可の席コード。
      # ユーザーから直接入力させず、Rails側でT01、C01などを自動生成する。
      t.string :code,
                null: false,
                limit: 20

      # 席の表示名。
      # 例：窓側テーブル、入口側カウンター、奥座敷
      t.string :name,
                null: false,
                limit: 100

      # この席単体で案内できる最大人数。
      # カウンター1席なら1、4名テーブルなら4を設定する。
      t.integer :capacity,
                null: false

      # 新規予約時に使用可能な席かを表す。
      # falseにしても過去の予約履歴との関連は保持する。
      t.boolean :active,
                null: false,
                default: true

      # 予約タイムラインやマスタ一覧での表示順。
      # codeやsequence_numberとは独立して並び順を変更できるようにする。
      t.integer :position,
                null: false,
                default: 0

      # 席についての補足情報。
      # 例：車椅子対応、柱の横、席結合可能
      t.text :memo

      # 楽観的ロックに使用するバージョン番号。
      # 更新されるたびにRailsが値を加算し、古い画面からの更新を拒否する。
      t.integer :lock_version,
                null: false,
                default: 0

      # この席を新規登録した担当者。
      t.references :created_by_staff,
                    null: false,
                    foreign_key: {
                      to_table: :staffs
                    }

      # この席を最後に更新した担当者。
      t.references :updated_by_staff,
                    null: false,
                    foreign_key: {
                      to_table: :staffs
                    }

      # created_atとupdated_atを追加する。
      t.timestamps
    end

    # T01などの完成済み席コードを重複不可にする。
    add_index :restaurant_masters,
              :code,
              unique: true

    # 同じ席種内で同じ連番を二重に使用できないようにする。
    #
    # 許可：
    # テーブル席の1番
    # カウンター席の1番
    #
    # 不許可：
    # テーブル席の1番が2件
    add_index :restaurant_masters,
              [
                :restaurant_master_type_id,
                :sequence_number
              ],
              unique: true,
              name: "idx_restaurant_masters_type_and_sequence"

    # 席種内の連番は1以上に限定する。
    add_check_constraint :restaurant_masters,
                          "sequence_number > 0",
                          name: "check_restaurant_masters_sequence_positive"

    # 定員は1名以上に限定する。
    add_check_constraint :restaurant_masters,
                          "capacity > 0",
                          name: "check_restaurant_masters_capacity_positive"

    # 表示順には負数を設定できないようにする。
    add_check_constraint :restaurant_masters,
                          "position >= 0",
                          name: "check_restaurant_masters_position_non_negative"

    # NOT NULLだけでは空文字を防げないため、空白のみのcodeを拒否する。
    add_check_constraint :restaurant_masters,
                          "char_length(btrim(code)) > 0",
                          name: "check_restaurant_masters_code_not_blank"

    # 空白のみの表示名を拒否する。
    add_check_constraint :restaurant_masters,
                          "char_length(btrim(name)) > 0",
                          name: "check_restaurant_masters_name_not_blank"
  end
end