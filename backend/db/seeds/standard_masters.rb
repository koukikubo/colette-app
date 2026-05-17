standard_master_seeds = [
  {
    code: "gender",
    name: "性別",
    description: "顧客性別管理",
    position: 1,
    items: [
      {
        code: "male",
        label: "男性",
        position: 1
      },
      {
        code: "female",
        label: "女性",
        position: 2
      },
      {
        code: "other",
        label: "不明",
        position: 3
      }
    ]
  },

  {
    code: "reservation_status",
    name: "予約状態",
    description: "予約ステータス管理",
    position: 2,
    items: [
      {
        code: "reserved",
        label: "予約済",
        position: 1
      },
      {
        code: "visited",
        label: "来店済",
        position: 2
      },
      {
        code: "cancelled",
        label: "キャンセル",
        position: 3
      },
      {
        code: "no_show",
        label: "無断キャンセル",
        position: 4
      }
    ]
  },

  {
    code: "reservation_route",
    name: "予約経路",
    description: "予約流入経路",
    position: 3,
    items: [
      {
        code: "phone",
        label: "電話",
        description: "",
        position: 1
      },
      {
        code: "instagram",
        label: "Instagram",
        description: "",
        position: 2
      },
      {
        code: "mail",
        label: "メール",
        description: "",
        position: 3
      },
      {
        code: "gurunavi",
        label: "ぐるなび",
        description: "",
        position: 4
      },
      {
        code: "walk_in",
        label: "飛び込み",
        description: "",
        position: 5
      }
    ]
  },

  {
    code: "staff_role",
    name: "担当者権限",
    description: "スタッフ権限管理",
    position: 4,
    items: [
      {
        code: "owner",
        label: "店主権限",
        description: "全ての機能にアクセス可能",
        position: 1
      },
      {
        code: "manager",
        label: "管理者",
        description: "オーナー機能を除く全ての機能にアクセス可能",
        position: 2
      },
      {
        code: "staff",
        label: "一般スタッフ",
        description: "管理メニューを除く機能にアクセス可能",
        position: 3
      },
      {
        code: "viewer",
        label: "閲覧のみ",
        description: "閲覧専用の権限。登録や編集などの操作は不可",
        position: 4
      }
    ]
  },

  {
    code: "table_area",
    name: "席エリア",
    description: "店舗内座席エリア",
    position: 5,
    items: [
      {
        code: "counter",
        label: "1番カウンター",
        position: 1
      },
      {
        code: "counter",
        label: "2番カウンター",
        position: 2
      },
      {
        code: "counter",
        label: "3番カウンター",
        position: 3
      },
      {
        code: "counter",
        label: "4番カウンター",
        position: 4
      },
      {
        code: "counter",
        label: "5番カウンター",
        position: 5
      },
      {
        code: "counter",
        label: "6番カウンター",
        position: 6
      },
      {
        code: "counter",
        label: "7番カウンター",
        position: 7
      },
      {
        code: "counter",
        label: "8番カウンター",
        position: 8
      },
      {
        code: "counter",
        label: "9番カウンター",
        position: 9
      },
      {
        code: "counter",
        label: "10番カウンター",
        position: 10
      },
      {
        code: "counter",
        label: "11番カウンター",
        position: 11
      },
      {
        code: "counter",
        label: "12番カウンター",
        position: 12
      },
      {
        code: "counter",
        label: "13番カウンター",
        position: 13
      },
      {
        code: "counter",
        label: "14番カウンター",
        position: 14
      },
      {
        code: "counter",
        label: "15番カウンター",
        position: 15
      },
      {
        code: "counter",
        label: "16番カウンター",
        position: 16
      },
      {
        code: "table",
        label: "菊テーブル",
        position: 12
      },
      {
        code: "table",
        label: "梅テーブル",
        position: 13
      },
      {
        code: "table",
        label: "竹テーブル",
        position: 14
      },
      {
        code: "table",
        label: "松テーブル",
        position: 15
      },
      {
        code: "table",
        label: "Aテーブル",
        position: 16
      },
      {
        code: "table",
        label: "Bテーブル",
        position: 17
      },
      {
        code: "table",
        label: "Cテーブル",
        position: 18
      },
      {
        code: "table",
        label: "Dテーブル",
        position: 19
      }
    ]
  }
]

standard_master_seeds.each do |master_seed|
  standard_master = StandardMaster.find_or_initialize_by(
    code: master_seed[:code]
  )

  standard_master.update!(
    name: master_seed[:name],
    description: master_seed[:description],
    active: true,
    position: master_seed[:position]
  )

  master_seed[:items].each do |item_seed|
    standard_list_master =
      standard_master.standard_list_masters.find_or_initialize_by(
        code: item_seed[:code]
      )

    standard_list_master.update!(
      label: item_seed[:label],
      active: true,
      position: item_seed[:position]
    )
  end
end

puts "StandardMaster seed completed!"