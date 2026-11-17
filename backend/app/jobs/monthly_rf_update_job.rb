class MonthlyRfUpdateJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: 30.seconds, attempts: 3

  def perform(month = nil)
    # 月境界をまたぐ再試行でも対象月を変えない。
    target = month || Date.current.prev_month.beginning_of_month.iso8601
    self.arguments = [ target ]
    Rf::MonthlyUpdater.call(month: target)
  end
end
