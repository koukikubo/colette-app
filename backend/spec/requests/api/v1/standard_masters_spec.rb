require 'rails_helper'

RSpec.describe "Api::V1::StandardMasters", type: :request do
  let!(:gender_master) do
    StandardMaster.create!(
      code: "gender",
      name: "性別",
      description: "顧客性別管理",
      position: 1,
    )
  end


    let!(:male_item) do
      gender_master.standard_list_masters.create!(
        code: "male",
        label: "男性",
        active: true,
        position: 1
      )
    end

    let!(:female_item) do
      gender_master.standard_list_masters.create!(
        code: "female",
        label: "女性",
        active: true,
        position: 2
      )
    end

  describe "GET /api/v1/standard_masters" do
    it "基本コードマスタ一覧を取得できる" do
      get "/api/v1/standard_masters"

      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      
      expect(json["status"]).to eq("success")
      expect(json["data"]).to be_an(Array)
      expect(json["data"].first["code"]).to eq("gender")
      expect(json["data"].first["items"]).to be_an(Array)
      expect(json["data"].first["items"].first["code"]).to eq("male")
    end
  end

  describe "GET /api/v1/standard_masters/:code" do
    it "基本コードマスタ詳細を取得できる" do
      get "/api/v1/standard_masters/gender"

      expect(response).to have_http_status(:ok)

      json = JSON.parse(response.body)

      expect(json["status"]).to eq("success")
      expect(json["data"]["code"]).to eq("gender")
      expect(json["data"]["name"]).to eq("性別")
      expect(json["data"]["items"].size).to eq(2)
    end

    it "存在しないコードの場合は404が返る" do
      get "/api/v1/standard_masters/unknown"

      expect(response).to have_http_status(:not_found)

      json = JSON.parse(response.body)
      expect(json["status"]).to eq("error")
      expect(json["message"]).to eq("データが見つかりませんでした")
    end
  end
end
