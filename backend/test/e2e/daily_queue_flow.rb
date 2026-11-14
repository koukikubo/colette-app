require_relative "guard"
require "fugit"
require "tempfile"
require "timeout"
require "yaml"

# RSpecのJobモックを使わず、scheduler→永続queue→別worker→RF適用を確認する。
def assert!(condition, message)
  raise message unless condition
end

config = ActiveSupport::ConfigurationFile.parse(Rails.root.join("config/recurring.yml"))
task = config.fetch("production").fetch("daily_rf_update")
assert!(task.fetch("class") == "DailyRfUpdateJob", "Unexpected daily job class")
cron = Fugit.parse_cron(task.fetch("schedule"))
assert!(cron, "Invalid production cron")
# UTCの日付をまたぐ冬・夏の双方で、翌日の日本時間03:00であることを検証する。
%w[2026-01-14 2026-07-14].each do |day|
  start = Time.iso8601("#{day}T18:01:00+09:00")
  next_time = cron.next_time(start).to_t.in_time_zone("Asia/Tokyo")
  expected = start.in_time_zone("Asia/Tokyo").tomorrow.change(hour: 3, min: 0, sec: 0)
  assert!(next_time == expected, "Production cron is not daily 03:00 JST")
end
assert!(RfRuleSet.where(status: "published").exists?, "Prepare E2E RF rules first")
assert!(!RfCalculationRun.where(execution_source: "daily").exists?, "Use a fresh dedicated E2E database")

# schemaのforce指定が既存queueを消さないよう、空の専用DBのみを許可する。
assert!(ActiveRecord::Base.connection.tables.none? { |name| name.start_with?("solid_queue_") }, "Queue schema already exists")
# 毎日の計算で未訪問顧客の結果が保存されることも確認する。
owner = Staff.joins(:staff_master).find_by!(staff_masters: { code: "E2E_OWNER" })
customer = Customer.create!(customer_kind: "individual", name: "E2E自動更新対象", kana: "ジドウコウシンタイショウ",
  created_by_staff: owner, updated_by_staff: owner)
load Rails.root.join("db/queue_schema.rb")
SolidQueue::Record.establish_connection(ENV.fetch("DATABASE_URL"))
ActiveJob::Base.queue_adapter = :solid_queue

initial_setting_version = RfSetting.first_or_create!.lock_version
log_path = Rails.root.join("tmp/e2e-daily-queue.log")
recurring = Tempfile.new([ "e2e-recurring-", ".yml" ], Rails.root.join("tmp"))
pid = nil
begin
  # 03:00まで待たずに同じJobを2回配送する。短縮scheduleはこの子プロセスだけへ渡す。
  recurring.write({ "test" => { "daily_rf_update" => task.merge("schedule" => "*/5 * * * * *") } }.to_yaml)
  recurring.flush
  pid = Process.spawn({ "E2E_RECURRING_FILE" => recurring.path },
    "bundle", "exec", "rails", "runner", "test/e2e/queue_worker.rb",
    chdir: Rails.root.to_s, out: log_path.to_s, err: [ :child, :out ])
  deadline = Process.clock_gettime(Process::CLOCK_MONOTONIC) + 90
  # 別プロセスのコミットを各回で読む。runnerのquery cacheで初回のnilを保持しない。
  ActiveRecord::Base.uncached do
    SolidQueue::Record.uncached do
      loop do
        assert!(!Process.waitpid(pid, Process::WNOHANG), "Queue supervisor exited; see #{log_path}")
        assert!(SolidQueue::FailedExecution.count.zero?, "Queue execution failed; see #{log_path}")
        run = RfCalculationRun.find_by(execution_source: "daily")
        if run&.monthly_apply_state == "applied"
          assert!(RfSetting.first!.lock_version == initial_setting_version + 1, "Duplicate daily job reapplied results")
          if SolidQueue::Job.where(class_name: "DailyRfUpdateJob").where.not(finished_at: nil).count >= 2
            setting = RfSetting.first!
            assert!(RfCalculationRun.where(execution_source: "daily").count == 1, "Duplicate daily calculation")
            assert!(run.status == "completed" && run.base_date == Date.current && run.scheduled_on == Date.current, "Incorrect daily result")
            assert!(setting.current_calculation_run_id == run.id, "Daily results not applied")
            assert!(SolidQueue::RecurringExecution.where(task_key: "daily_rf_update").count >= 2, "Scheduler did not enqueue twice")
            assert!(run.customer_rf_rank_results.count == Customer.count, "Customer calculation incomplete")
            assert!(run.customer_rf_rank_results.exists?(customer_id: customer.id), "Unvisited customer result missing")
            puts "Daily queue flow passed: scheduler -> persisted queue -> fork worker -> applied, duplicate delivery is idempotent"
            break
          end
        end
        assert!(Process.clock_gettime(Process::CLOCK_MONOTONIC) < deadline, "Daily queue flow timed out; see #{log_path}")
        sleep 0.25
      end
    end
  end
ensure
  if pid
    begin
      Process.kill("TERM", pid)
      Timeout.timeout(15) { Process.wait(pid) }
    rescue Errno::ESRCH, Errno::ECHILD
      # 既に終了した子を再度停止しない。
    rescue Timeout::Error
      Process.kill("KILL", pid)
      Process.wait(pid)
    end
  end
  recurring.close!
end
