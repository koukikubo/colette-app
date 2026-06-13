FactoryBot.define do
  factory :standard_master do
    sequence(:name) { |number| "基本コード#{number}" }
    sequence(:position) { |number| number }

    description { "基本コードの説明" }
    active { true }
  end
end
