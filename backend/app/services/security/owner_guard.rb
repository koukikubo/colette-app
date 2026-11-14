module Security
  module OwnerGuard
    def self.lock!
      ActiveRecord::Base.connection.execute("SELECT pg_advisory_xact_lock(431901)")
    end

    def self.other_owner_exists?(master_id)
      StaffMaster.joins(:staff).where(role_code: "owner", retired_on: nil)
        .where(staffs: { login_enabled: true }).where.not(id: master_id).exists?
    end
  end
end
