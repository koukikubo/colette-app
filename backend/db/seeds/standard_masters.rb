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
        code: "seated",
        label: "来店済み",
        description: "お客様が来店して着席している状態",
        position: 2
      },
      {
        code: "completed",
        label: "対応完了",
        description: "来店対応が完了している状態",
        position: 3
      },
      {
        code: "canceled",
        label: "取消",
        description: "予約が取り消された状態",
        position: 4
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