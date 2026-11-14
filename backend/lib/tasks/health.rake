namespace :health do
  desc "監視用: DB接続と長時間RF処理を検査（失敗時は非0終了）"
  task check: :environment do
    ActiveRecord::Base.connection.select_value("SELECT 1")
    stuck = RfCalculationRun.where(status: "processing").where("started_at < ? OR started_at IS NULL", 1.hour.ago).exists?
    abort "RF処理が長時間processingのままです。workerと復旧手順を確認してください" if stuck
    puts "DBとRF処理の検査に成功しました"
  end
end
