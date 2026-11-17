module Reservations
  class CalendarSummary
    def self.call(month:)
      raise ArgumentError, "年月はYYYY-MMで指定してください" unless month.is_a?(String) && month.match?(/\A\d{4}-\d{2}\z/)
      start = Date.iso8601("#{month}-01")
      raise ArgumentError, "年月の範囲が不正です" unless (1900..2100).cover?(start.year)
      # 開始日を店舗時刻で集計する。席の複数割当をJOINして予約を重複計上しない。
      relation = Reservation.active.where(starts_at: start.in_time_zone...start.next_month.in_time_zone)
      expression = Arel.sql("DATE(starts_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')")
      # 同時登録があっても件数と人数が異なる時点の値にならないよう、同一SQLで取得する。
      daily = relation.group(expression).pluck(expression, Arel.sql("COUNT(*)"), Arel.sql("SUM(guest_count)"))
        .to_h { |day, count, guests| [ day, [ count, guests ] ] }
      { month: month, days: (start...start.next_month).map { |day|
        count, guests = daily.fetch(day, [ 0, 0 ])
        { date: day.iso8601, reservation_count: count, guest_count: guests }
      } }
    end
  end
end
