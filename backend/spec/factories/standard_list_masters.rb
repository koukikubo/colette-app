FactoryBot.define do
  factory :standard_list_master do
    association :standard_master

    sequence(:label) { |number| "選択肢#{number}" }
    sequence(:position) { |number| number }

    description { "選択肢コードの説明" }
    active { true }
  end
end
