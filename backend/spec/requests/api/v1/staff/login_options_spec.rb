# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Api::V1::Staff::LoginOptions", type: :request do
  describe "GET /api/v1/staff/login_options" do
    let!(:staff_master) do
      create(
        :staff_master,
        code: "00001",
        name: "店主",
        role_code: "owner",
        retired_on: nil
      )
    end

    let!(:staff) do
      create(
        :staff,
        staff_master: staff_master,
        login_enabled: true,
        failed_attempts: 0
      )
    end

    it "未ログインでも担当者候補を取得できる" do
      get "/api/v1/staff/login_options"

      expect(response).to have_http_status(:ok)

      body = response.parsed_body

      expect(body.dig("data", "staff_options")).to contain_exactly(
        {
          "id" => staff.id,
          "code" => "00001",
          "name" => "店主"
        }
      )
    end
  end
end