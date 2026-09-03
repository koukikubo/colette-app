# frozen_string_literal: true

puts "ページネーション確認用の顧客データを作成します"

seed_staff =
  Staff
    .joins(:staff_master)
    .where(login_enabled: true)
    .where(
      staff_masters: {
        role_code: "owner",
        retired_on: nil
      }
    )
    .order(:id)
    .first!

family_names = %w[
  佐藤 鈴木 高橋 田中 伊藤 渡辺 山本 中村 小林 加藤
].freeze

family_name_kanas = %w[
  サトウ スズキ タカハシ タナカ イトウ ワタナベ
  ヤマモト ナカムラ コバヤシ カトウ
].freeze

given_names = %w[
  太郎 花子 一郎 美咲 健 陽子 翔太 結衣 大輔 愛
].freeze

given_name_kanas = %w[
  タロウ ハナコ イチロウ ミサキ ケン ヨウコ
  ショウタ ユイ ダイスケ アイ
].freeze

Customer.transaction do
  1.upto(3_000) do |number|
    family_index = (number - 1) % family_names.length
    given_index = ((number - 1) / family_names.length) % given_names.length

    corporate = (number % 10).zero?
    email = format("customer%04d@seed.colette.test", number)

    customer = Customer.find_or_initialize_by(email: email)

    customer.assign_attributes(
      customer_kind: corporate ? "corporate" : "individual",
      name: "#{family_names[family_index]} #{given_names[given_index]}",
      kana:
        "#{family_name_kanas[family_index]} " \
        "#{given_name_kanas[given_index]}",
      postal_code: format("%07d", 1_000_000 + number),
      address: "大阪府大阪市北区テスト町#{number}",
      phone_number: format("090%08d", number),
      birthday: Date.new(
        1960 + (number % 45),
        (number % 12) + 1,
        (number % 28) + 1
      ),
      company_name:
        corporate ? "株式会社Coletteテスト#{number}" : nil,
      company_name_kana:
        corporate ? "カブシキガイシャコレットテスト" : nil,
      company_postal_code:
        corporate ? format("%07d", 5_000_000 + number) : nil,
      company_address:
        corporate ? "大阪府大阪市中央区法人町#{number}" : nil,
      company_phone_number:
        corporate ? format("066%07d", number) : nil,
      company_email:
        corporate ? format("company%04d@seed.colette.test", number) : nil,
      memo: "ページネーション確認用のSeed顧客",
      hidden_at: (Time.current if (number % 20).zero?),
      created_by_staff: customer.created_by_staff || seed_staff,
      updated_by_staff: seed_staff
    )

    customer.save!
  end
end

seed_customer_count =
  Customer.where(
    "email LIKE ?",
    "%@seed.colette.test"
  ).count

puts "#{seed_customer_count}件の顧客Seedデータを登録しました"
