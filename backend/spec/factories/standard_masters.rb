FactoryBot.define do
  factory :standard_master do
    sequence(:system_key) do |number|
      "standard_master_#{number}"
    end

    sequence(:name) do |number|
      "基本コード#{number}"
    end

    sequence(:position) do |number|
      number
    end

    description { "基本コードの説明" }
    active { true }
  end
end