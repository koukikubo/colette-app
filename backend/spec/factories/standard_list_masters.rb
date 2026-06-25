# backend/spec/factories/standard_list_masters.rb

FactoryBot.define do
  factory :standard_list_master do
    association :standard_master

    sequence(:code) do |number|
      "CODE#{number}"
    end

    sequence(:label) do |number|
      "選択肢#{number}"
    end

    sequence(:position) do |number|
      number
    end

    description { "選択肢コードの説明" }
    active { true }
  end
end