require 'rails_helper'

RSpec.describe "Api::V1::StandardListMasters", type: :request do

  let!(:gender_master) do
    StandardMaster.create!(
      code: "gender",
      name: "性別",
      description: "顧客性別管理",
      active: true,
      position: 1,
    )
  end
  
    let!(:female_item) do
      gender_master.standard_list_masters.create!(
        code: "female",
        label: "女性",
        active: true,
        position: 1
      )
    end

    let!(:male_item) do
      gender_master.standard_list_masters.create!(
        code: "male",
        label: "男性",
        active: true,
        position: 2
      )
    end
  describe "GET /api/v1/standard_masters/:standard_master_code/items" do
    it "基本コードマスタのアイテム一覧を取得できる" do
      get "/api/v1/standard_masters/gender/items"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json["status"]).to eq("success")
      expect(json["data"]).to be_an(Array)
      expect(json["data"].size).to eq(2)
      expect(json["data"].first["code"]).to eq("female")
      expect(json["data"].first["code"]).to eq("female")
    end

    it "存在しない基本コードマスタの場合は404を返す" do
      get "/api/v1/standard_masters/non_existent/items"

      expect(response).to have_http_status(:not_found)

      json = JSON.parse(response.body)

      expect(json["status"]).to eq("error")
      expect(json["message"]).to eq("データが見つかりませんでした")
    end
  end
end
