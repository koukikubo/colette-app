require_relative "guard"
# 本番と同じSolid Queue adapter・fork workerを、専用DBだけに接続する。
SolidQueue::Record.establish_connection(ENV.fetch("DATABASE_URL"))
ActiveJob::Base.queue_adapter = :solid_queue
SolidQueue::Supervisor.start(recurring_schedule_file: ENV.fetch("E2E_RECURRING_FILE"))
