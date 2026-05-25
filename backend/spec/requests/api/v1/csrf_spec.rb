# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Csrf", type: :request do
  describe "GET /api/v1/csrf" do
    it "CSRFトークンを返すこと" do
      get "/api/v1/csrf"

      expect(response).to have_http_status(:ok)

      body = JSON.parse(response.body)

      expect(body["status"]).to eq("success")
      expect(body.dig("data", "csrf_token")).to be_present
    end

    it "session cookieを発行すること" do
      get "/api/v1/csrf"

      expect(response.headers["Set-Cookie"]).to include("_colette_session")
    end
  end
end