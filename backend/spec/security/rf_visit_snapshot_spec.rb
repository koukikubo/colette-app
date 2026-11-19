require "rails_helper"

RSpec.describe "RF計算中の来店結果訂正", type: :model do
  include_context "independent integrity connections"

  after do
    if @run
      CustomerRfRankResult.where(rf_calculation_run_id: @run.id).delete_all
      @run.delete
    end
  end

  it "別接続の訂正を途中の顧客だけへ反映せず、次の計算へ反映する" do
    staff, _type, attributes = booking_setup
    StandardListMaster.find(attributes[:reservation_status_id]).update!(code: "confirmed")
    rank = tracked(:standard_list_master, standard_master: tracked(:standard_master, system_key: "rf_rank"))
    rule = RfRuleSet.create!(name: @marker, version: 1, aggregation_months: 60, frequency_window_months: 12, status: "published", no_visit_rank: rank)
    @records << rule
    customers = 2.times.map { tracked(:customer, name: @marker, created_by_staff: staff, updated_by_staff: staff) }
    start = 1.day.ago.change(hour: 18)
    bookings = customers.map do |customer|
      Reservations::CreateService.call(attributes: attributes.merge(customer_id: customer.id, starts_at: start, ends_at: start + 2.hours, completed_at: Time.current), current_staff: staff)
    end
    @run = RfCalculationRun.create!(rf_rule_set: rule, started_by_staff: staff, base_date: Date.current,
      aggregation_started_on: Date.current.advance(months: -60), frequency_started_on: Date.current.advance(months: -12), status: "pending")
    changed = false
    allow(Rf::CustomerRankCalculator).to receive(:call) do |**args|
      unless changed
        changed = true
        # 計算の入力取得後に別接続で本物の訂正をコミットする。予約更新を長時間止めない。
        Timeout.timeout(10) do
          Thread.new do
            ActiveRecord::Base.connection_pool.with_connection do
              Reservations::ResultChanger.call(reservation: Reservation.find(bookings.last.id), attributes: { lock_version: 0, visit_result: "no_show" },
                current_staff: staff, key: SecureRandom.uuid, operation: "correct_result")
            end
          end.value
        end
      end
      summary = args.fetch(:visit_summary)
      Rf::CustomerRankCalculator::Result.new(rf_rank: rank, recency_days: 1,
        frequency_count: summary.fetch(:frequency_count), last_visit_on: summary.fetch(:last_visit_on))
    end
    Rf::CalculationRunner.call(calculation_run: @run)
    expect(@run.customer_rf_rank_results.order(:customer_id).pluck(:frequency_count)).to eq([ 1, 1 ])
    fresh = Rf::CalculationInputs.call(rule_set: rule, base_date: Date.current)
    expect(fresh.fetch(customers.last.id).fetch(:frequency_count)).to eq(0)
    expect(@run.reload.status).to eq("completed")
  end
end
