require "rails_helper"

RSpec.describe "Staff master authorization", type: :request do
  include_context "authenticated request"

  %w[operator viewer].each do |role|
    context "as #{role}" do
      before do
        login_staff.staff_master.update!(role_code: role)
        login!
      end

      it "rejects self-promotion without changing the role" do
        patch "/api/v1/staff_masters/#{login_staff.staff_master_id}",
              params: { staff_master: { role_code: "owner" } },
              headers: authenticated_headers, as: :json
        expect(response).to have_http_status(:forbidden)
        expect(login_staff.staff_master.reload.role_code).to eq(role)
      end

      it "rejects creating an owner" do
        expect do
          post "/api/v1/staff_masters", params: {
            staff_master: { code: "FORBIDDEN", name: "Forbidden", role_code: "owner", employment_started_on: "2026-01-01" },
            staff: { password: "Password123!", password_confirmation: "Password123!", login_enabled: true }
          }, headers: authenticated_headers, as: :json
        end.not_to change(StaffMaster, :count)
        expect(response).to have_http_status(:forbidden)
      end

      %w[retire restore login_enabled reset_failed_attempts].each do |action|
        it "rejects #{action} without changing the staff" do
          master_before = login_staff.staff_master.attributes
          staff_before = login_staff.reload.attributes
          patch "/api/v1/staff_masters/#{login_staff.staff_master_id}/#{action}",
                params: { staff_master: { retired_on: "2026-11-10" }, staff: { login_enabled: false } },
                headers: authenticated_headers, as: :json
          expect(response).to have_http_status(:forbidden)
          expect(login_staff.staff_master.reload.attributes).to eq(master_before)
          expect(login_staff.reload.attributes).to eq(staff_before)
        end
      end
    end
  end
end
