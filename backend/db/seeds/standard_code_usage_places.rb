# schema:load 後にも復元できる利用先定義。通常データや回答は変更しない。
[
  { key: "customer_details", name: "顧客詳細", description: "顧客の詳細情報で選択・保存できます。", position: 1 },
  { key: "reservation_details", name: "予約詳細", description: "予約画面への表示・入力は後続対応です。", position: 2 }
].each do |attributes|
  StandardCodeUsagePlace.find_or_create_by!(key: attributes.fetch(:key)) { |place| place.assign_attributes(attributes) }
end
