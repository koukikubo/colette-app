module Rf
  class DailyUpdater
    def self.call(date:)
      day = Date.iso8601(date.to_s)
      raise ArgumentError, "実行日は今日以前のYYYY-MM-DDで指定してください" if day > Date.current
      AutomaticUpdater.call(execution_source: "daily", scheduled_date: day, base_date: day)
    end
  end
end
