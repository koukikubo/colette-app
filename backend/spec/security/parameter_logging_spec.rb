require "rails_helper"

RSpec.describe "個人情報ログ保護" do
  it "個人情報と検索語をネスト内もフィルタリングする" do
    filter = ActiveSupport::ParameterFilter.new(Rails.application.config.filter_parameters)
    value = filter.filter(customer: { name: "個人名", phone_number: "09012345678", address: "住所" }, query: "検索氏名", reservation: { allergy_note: "卵" })
    expect(value.to_s).not_to include("個人名", "09012345678", "住所", "検索氏名", "卵")
  end

end
