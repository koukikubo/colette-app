namespace :rf do
  desc "RFジョブ再配信（同一IDの実行中処理はロックで保護）"
  task recover: :environment do
    run = RfCalculationRun.find(ENV.fetch("RUN_ID"))
    abort "processing状態のみ復旧できます" unless run.status == "processing"
    RfCalculationRunJob.perform_later(run.id)
    puts "復旧ジョブを登録しました"
  end
end
