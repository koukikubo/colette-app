namespace :rf do
  desc "RFジョブ再配信（同一IDの実行中処理はロックで保護）"
  task recover: :environment do
    run = RfCalculationRun.find(ENV.fetch("RUN_ID"))
    if run.execution_source == "daily"
      abort "日次計算はpending/processing/failed状態だけを再配信できます" unless %w[pending processing failed].include?(run.status)
      DailyRfUpdateJob.perform_later(run.scheduled_on.iso8601)
    elsif run.execution_source == "monthly"
      abort "月次計算はpending/processing/failed状態だけを再配信できます" unless %w[pending processing failed].include?(run.status)
      MonthlyRfUpdateJob.perform_later(run.scheduled_month.iso8601)
    else
      abort "processing状態のみ復旧できます" unless run.status == "processing"
      RfCalculationRunJob.perform_later(run.id)
    end
    puts "復旧ジョブを登録しました"
  end
end
