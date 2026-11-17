require "rails_helper"
RSpec.describe DailyRfUpdateJob, type: :job do
  include ActiveSupport::Testing::TimeHelpers
  include ActiveJob::TestHelper
  it "実行日の対象を固定し、失敗後の再試行にも同じ日を渡す" do
    travel_to Time.zone.local(2026, 11, 14, 3) do
      allow(Rf::DailyUpdater).to receive(:call).and_raise(StandardError, "temporary")
      expect { described_class.perform_now }.to have_enqueued_job(described_class).with("2026-11-14")
      expect(Rf::DailyUpdater).to have_received(:call).with(date: "2026-11-14")
    end
  end
end
