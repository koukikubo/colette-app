require "rails_helper"

RSpec.describe "操作権限表", type: :request do
  include_context "authenticated request"

  %w[owner operator viewer].each do |role|
    context role do
      before do
        login_staff.staff_master.update!(role_code: role)
        login!
      end
      %w[customers reservations restaurant_masters standard_masters staff_masters rf_calculation_runs rf_rule_sets].each do |resource|
        it "#{resource}の書込を権限表に従って制御する" do
          post "/api/v1/#{resource}", params: {}, headers: authenticated_headers, as: :json
          allowed = role == "owner" || (role == "operator" && %w[customers reservations].include?(resource))
          if allowed
            expect(response).not_to have_http_status(:forbidden)
          else
            expect(response).to have_http_status(:forbidden)
          end
        end
      end
    end
  end
end
