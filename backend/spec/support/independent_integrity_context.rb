require "timeout"

RSpec.shared_context "independent integrity connections" do
  self.use_transactional_tests = false

  def tracked(factory, **attributes)
    record = create(factory, **attributes)
    @records << record
    record
  end

  around do |example|
    @records = []
    @marker = "再送並行#{SecureRandom.hex(6)}"
    example.run
  ensure
    ids = Reservation.where(reservation_name: @marker).pluck(:id)
    ReservationCreationRequest.where(reservation_id: ids).delete_all
    Reservation.where(id: ids).destroy_all
    @records.reverse_each { |record| record.reload.delete }
  end

  def concurrently
    ready = Queue.new
    go = Queue.new
    threads = 2.times.map do |index|
      Thread.new do
        ActiveRecord::Base.connection_pool.with_connection do
          ready << true
          go.pop
          yield(index)
        end
      end
    end
    Timeout.timeout(20) do
      2.times { ready.pop }
      2.times { go << true }
      threads.map(&:value)
    end
  ensure
    threads&.each { |thread| thread.kill if thread.alive? }
    threads&.each(&:join)
  end

  def booking_setup
    staff = tracked(:staff, staff_master: tracked(:staff_master))
    type = tracked(:standard_list_master, standard_master: tracked(:standard_master, system_key: "restaurant_master_type"))
    status = tracked(:standard_list_master, standard_master: tracked(:standard_master, system_key: "reservation_status"))
    start = Time.zone.today.next_day.beginning_of_day + 18.hours
    [ staff, type, { reservation_name: @marker, reservation_phone_number: "09011112222", guest_count: 4,
      starts_at: start, ends_at: start + 2.hours,
      requested_restaurant_master_type_id: type.id, reservation_status_id: status.id } ]
  end
end
