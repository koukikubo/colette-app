# frozen_string_literal: true

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
        description: "電話による予約",
        position: 1
      },
      {
        code: "instagram",
        label: "Instagram",
        description: "Instagramからの予約",
        position: 2
      },
      {
        code: "mail",
        label: "メール",
        description: "メールによる予約",
        position: 3
      },
      {
        code: "gurunavi",
        label: "ぐるなび",
        description: "ぐるなびからの予約",
        position: 4
      },
      {
        code: "walk_in",
        label: "飛び込み",
        description: "事前予約なしの来店",
        position: 5
      },
      {
        code: "other",
        label: "その他",
        description: "上記以外の予約経路",
        position: 99
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
        description: "予約受付が完了している状態",
        position: 1
      },
      {
        code: "tentative",
        label: "仮予約",
        description: "予約受付が仮の状態",
        position: 2
      }
    ]
  },
  {
    system_key: "reservation_menu_type",
    name: "予約メニュー種",
    description: "予約時に選択するメニューの種類を管理する",
    position: 4,
    items: [
      {
        code: "undecided",
        label: "未定",
        description: "予約登録時点でメニューが決まっていない",
        position: 1
      },
      {
        code: "omakase",
        label: "おまかせ",
        description: "店舗のおまかせ内容で提供する",
        position: 2
      },
      {
        code: "kaiseki",
        label: "会席",
        description: "会席料理を提供する",
        position: 3
      },
      {
        code: "course",
        label: "コース",
        description: "コース料理を提供する",
        position: 4
      },
      {
        code: "a_la_carte",
        label: "アラカルト",
        description: "当日に単品料理を注文する",
        position: 5
      },
      {
        code: "other",
        label: "その他",
        description: "上記以外のメニュー種",
        position: 99
      }
    ]
  },
  {
    system_key: "reservation_occasion",
    name: "予約利用目的",
    description: "予約時の利用目的を管理する",
    position: 5,
    items: [
      {
        code: "general",
        label: "通常利用",
        description: "特別な目的を伴わない通常利用",
        position: 1
      },
      {
        code: "birthday",
        label: "誕生日",
        description: "誕生日のお祝いを目的とした利用",
        position: 2
      },
      {
        code: "anniversary",
        label: "記念日",
        description: "結婚記念日などのお祝いを目的とした利用",
        position: 3
      },
      {
        code: "business",
        label: "接待",
        description: "取引先などの接待を目的とした利用",
        position: 4
      },
      {
        code: "meeting",
        label: "顔合わせ",
        description: "両家の顔合わせなどを目的とした利用",
        position: 5
      },
      {
        code: "memorial",
        label: "法事",
        description: "法事や法要を目的とした利用",
        position: 6
      },
      {
        code: "other",
        label: "その他",
        description: "上記以外の利用目的",
        position: 99
      }
    ]
  },
  {
    system_key: "customer_rank",
    name: "顧客ランク",
    description: "店舗が顧客へ手動で付与するランク",
    position: 6,
    items: [
      {
        code: "A",
        label: "Aランク",
        description: "店舗が手動で付与するAランク",
        position: 1
      },
      {
        code: "B",
        label: "Bランク",
        description: "店舗が手動で付与するBランク",
        position: 2
      },
      {
        code: "C",
        label: "Cランク",
        description: "店舗が手動で付与するCランク",
        position: 3
      },
      {
        code: "D",
        label: "Dランク",
        description: "店舗が手動で付与するDランク",
        position: 4
      },
      {
        code: "E",
        label: "Eランク",
        description: "店舗が手動で付与するEランク",
        position: 5
      },
      {
        code: "R",
        label: "Rランク",
        description: "RFランクの集計対象外とする顧客",
        position: 6
      }
    ]
  },
  {
    system_key: "rf_rank",
    name: "RFランク",
    description: "来店時期と来店回数から自動算出するランク",
    position: 7,
    items: [
      {
        code: "A",
        label: "Aランク",
        description: "来店時期・回数ともに高い顧客",
        position: 1
      },
      {
        code: "B",
        label: "Bランク",
        description: "継続的な来店がある顧客",
        position: 2
      },
      {
        code: "C",
        label: "Cランク",
        description: "標準的な来店実績の顧客",
        position: 3
      },
      {
        code: "D",
        label: "Dランク",
        description: "一定期間来店がない顧客",
        position: 4
      },
      {
        code: "E",
        label: "Eランク",
        description: "来店回数が少ない新規・低頻度顧客",
        position: 5
      },
      {
        code: "Z",
        label: "Zランク",
        description: "長期間来店がない休眠顧客",
        position: 6
      },
      {
        code: "N",
        label: "未分類",
        description: "RFランクの判定に必要な来店実績がない顧客",
        position: 7
      }
    ]
  }
]

standard_master_seeds.each do |master_seed|
  standard_master =
    StandardMaster.find_by(system_key: master_seed[:system_key]) ||
    StandardMaster.find_by(system_key: nil, name: master_seed[:name]) ||
    StandardMaster.new(system_key: master_seed[:system_key])

  standard_master.update!(
    system_key: master_seed[:system_key],
    name: master_seed[:name],
    description: master_seed[:description],
    active: true,
    position: master_seed[:position]
  )

  item_codes = master_seed[:items].pluck(:code)
  seed_positions = master_seed[:items].pluck(:position)

  obsolete_items =
    standard_master.standard_list_masters.where.not(code: item_codes)

  next_position =
    [ standard_master.standard_list_masters.maximum(:position).to_i + 1, 100 ].max

  obsolete_items
    .where(position: seed_positions)
    .order(:id)
    .each_with_index do |item, index|
    item.update_columns(
      active: false,
      position: next_position + index
    )
  end

  obsolete_items.update_all(active: false)

  master_seed[:items].each do |item_seed|
    standard_list_master =
      standard_master
        .standard_list_masters
        .find_by(code: item_seed[:code]) ||
      standard_master
        .standard_list_masters
        .find_by(code: nil, position: item_seed[:position]) ||
      standard_master
        .standard_list_masters
        .new(code: item_seed[:code])

    standard_list_master.update!(
      code: item_seed[:code],
      label: item_seed[:label],
      description: item_seed[:description],
      active: true,
      position: item_seed[:position]
    )
  end
end

puts "StandardMaster seed completed!"
