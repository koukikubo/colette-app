FactoryBot.define do
  factory :customer do
    association :created_by_staff, factory: :staff
    updated_by_staff { created_by_staff }

    customer_kind { "individual" }
    name { "山田 太郎" }
    kana { "ヤマダ タロウ" }

    postal_code { "5300001" }
    address { "大阪府大阪市北区梅田1-1-1" }
    phone_number { "09012345678" }
    email { "taro.yamada@example.com" }
    birthday { Date.new(1990, 1, 1) }

    company_name { nil }
    company_name_kana { nil }
    company_postal_code { nil }
    company_address { nil }
    company_phone_number { nil }
    company_email { nil }

    memo { nil }
    hidden_at { nil }

    trait :corporate do
      customer_kind { "corporate" }
      name { "鈴木 一郎" }
      kana { "スズキ イチロウ" }

      company_name { "株式会社浅井" }
      company_name_kana { "カブシキガイシャアサイ" }
      company_postal_code { "5420081" }
      company_address { "大阪府大阪市中央区南船場1-1-1" }
      company_phone_number { "0661234567" }
      company_email { "contact@example.co.jp" }
    end

    trait :hidden do
      hidden_at { Time.current }
    end
  end
end