require "rails_helper"
require "timeout"

RSpec.describe "同一席の並行予約", type: :model do
  self.use_transactional_tests = false

  def tracked_create(factory, **attributes)
    record = create(factory, **attributes)
    @records << record
    record
  end

  around do |example|
    @records = []
    @marker = "並行検証#{SecureRandom.hex(4)}"
    example.run
  ensure
    Reservation.where(reservation_name: @marker).destroy_all
    @records.reverse_each(&:delete)
  end

  it "別DB接続の顧客未選択予約は同じ席・時間に片方しか成功しない" do
    master = tracked_create(:staff_master)
    staff = tracked_create(:staff, staff_master: master)
    types = tracked_create(:standard_master, system_key: "restaurant_master_type")
    statuses = tracked_create(:standard_master, system_key: "reservation_status")
    type = tracked_create(:standard_list_master, standard_master: types, code: "T")
    status = tracked_create(:standard_list_master, standard_master: statuses, code: "confirmed")
    seat = tracked_create(:restaurant_master, restaurant_master_type: type, capacity: 4, created_by_staff: staff, updated_by_staff: staff)
    start = Time.zone.today.change(day: 1).beginning_of_day + 18.hours
    attributes = {
      reservation_name: @marker, reservation_phone_number: "09011112222",
      starts_at: start, ends_at: start + 2.hours, guest_count: 2,
      requested_restaurant_master_type_id: type.id,
      reservation_status_id: status.id, restaurant_master_ids: [ seat.id ]
    }
    ready = Queue.new
    go = Queue.new
    threads = 2.times.map do
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          go.pop
          begin
            Reservations::CreateService.call(attributes: attributes, current_staff: staff)
            :created
          rescue ActiveRecord::RecordInvalid
            :rejected
          end
        end
      end
    end
    Timeout.timeout(10) do
      2.times { ready.pop }
      2.times { go << true }
      expect(threads.map(&:value).sort).to eq([ :created, :rejected ])
    end
    expect(Reservation.where(reservation_name: @marker).count).to eq(1)
  ensure
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
  end
end
