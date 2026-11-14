require "rails_helper"
RSpec.describe MonthlyRfUpdateJob, type: :job do
  include ActiveSupport::Testing::TimeHelpers
  include ActiveJob::TestHelper
  it "実行月の対象を固定し、失敗後の再試行にも同じ月を渡す" do
    travel_to Time.zone.local(2026, 11, 1, 3) do
      allow(Rf::MonthlyUpdater).to receive(:call).and_raise(StandardError, "temporary")
      expect { described_class.perform_now }.to have_enqueued_job(described_class).with("2026-10-01")
      expect(Rf::MonthlyUpdater).to have_received(:call).with(month: "2026-10-01")
    end
  end
end
