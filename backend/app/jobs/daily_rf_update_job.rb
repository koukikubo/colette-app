class DailyRfUpdateJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: 30.seconds, attempts: 3

  def perform(date = nil)
    # 日付をまたいだ再試行でも、最初に選んだ実行日の履歴を再利用する。
    target = date || Date.current.iso8601
    self.arguments = [ target ]
    Rf::DailyUpdater.call(date: target)
  end
end
