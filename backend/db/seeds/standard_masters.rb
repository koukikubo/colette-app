standard_master_seeds = [
  {
    system_key: "reservation_route",
    name: "予約経路",
    description: "予約の流入経路を管理する",
    position: 1,
    items: [
      {
        code: "phone",
        label: "電話",
        position: 1
      },
      {
        code: "instagram",
        label: "Instagram",
        position: 2
      },
      {
        code: "mail",
        label: "メール",
        position: 3
      },
      {
        code: "gurunavi",
        label: "ぐるなび",
        position: 4
      },
      {
        code: "walk_in",
        label: "飛び込み",
        position: 5
      }
    ]
  },
  {
    system_key: "restaurant_master_type",
    name: "予約席種",
    description: "予約テーブルマスタで使用する席種",
    position: 2,
    items: [
      {
        code: "T",
        label: "テーブル席",
        description: "テーブル席コードの接頭辞",
        position: 1
      },
      {
        code: "C",
        label: "カウンター席",
        description: "カウンター席コードの接頭辞",
        position: 2
      }
    ]
  },
  {
    system_key: "reservation_status",
    name: "予約状態",
    description: "予約の進行状態を管理する",
    position: 3,
    items: [
      {
        code: "confirmed",
        label: "予約確定",
        position: 1
      },
      {
        code: "seated",
        label: "来店済み",
        position: 2
      },
      {
        code: "completed",
        label: "対応完了",
        position: 3
      },
      {
        code: "canceled",
        label: "取消",
        position: 4
      }
    ]
  }
]


standard_master_seeds.each do |master_seed|
  standard_master =
    StandardMaster.find_or_initialize_by(
      system_key: master_seed[:system_key]
    )

  standard_master.update!(
    name: master_seed[:name],
    description: master_seed[:description],
    active: true,
    position: master_seed[:position]
  )

  master_seed[:items].each do |item_seed|
    standard_list_master =
      standard_master
        .standard_list_masters
        .find_or_initialize_by(
          code: item_seed[:code]
        )

    standard_list_master.update!(
      label: item_seed[:label],
      description: item_seed[:description],
      active: true,
      position: item_seed[:position]
    )
  end
end

puts "StandardMaster seed completed!"