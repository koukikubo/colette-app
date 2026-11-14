namespace :security do
  desc "本番初回のみ: 秘密管理から渡した資格情報でownerを作成"
  task bootstrap_owner: :environment do
    Staff.transaction do
      Security::OwnerGuard.lock!
      abort "ownerは既に存在します" if StaffMaster.where(role_code: "owner").exists?
      master = StaffMaster.create!(code: ENV.fetch("BOOTSTRAP_OWNER_CODE"), name: ENV.fetch("BOOTSTRAP_OWNER_NAME"), role_code: "owner", employment_started_on: Date.current)
      password = ENV.fetch("BOOTSTRAP_OWNER_PASSWORD")
      master.create_staff!(password: password, password_confirmation: password, login_enabled: true)
    end
    puts "初期ownerを作成しました"
  end

  desc "DB管理者用: OWNER_CODEで指定したownerを復旧し全セッションを失効"
  task recover_owner: :environment do
    master = StaffMaster.find_by!(code: ENV.fetch("OWNER_CODE"), role_code: "owner", retired_on: nil)
    Staff.transaction do
      Security::OwnerGuard.lock!
      master.staff.lock!
      master.staff.update!(login_enabled: true, failed_attempts: 0, locked_at: nil)
      master.staff.staff_sessions.delete_all
    end
    puts "オーナーを復旧し既存セッションを失効しました"
  end
  desc "期限切れセッションと古い試行制限を削除"
  task cleanup: :environment do
    StaffSession.where("expires_at <= ? OR last_seen_at <= ?", Time.current, StaffSession::IDLE_TIMEOUT.ago).delete_all
    LoginThrottle.where("window_started_at < ?", 1.day.ago).delete_all
  end
end
