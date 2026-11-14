module Security
  class PasswordChanger
    class WrongPassword < StandardError; end
    class Forbidden < StandardError; end
    class Throttled < StandardError; end

    def self.call(actor:, subject:, attributes:, expected_version: nil)
      %i[current_password password password_confirmation].each do |key|
        value = attributes[key]
        unless value.is_a?(String) && value.present? && value.bytesize <= 72
          raise ActionController::BadRequest, "パスワード項目は72バイト以内の文字列で指定してください"
        end
      end
      raise Throttled unless LoginThrottle.allowed?("password-change:#{actor.id}", limit: 5)

      Staff.transaction do
        OwnerGuard.lock!
        actor.reload
        actor.staff_master.reload
        raise Forbidden unless actor.login_allowed?
        reset = actor.id != subject.id
        raise Forbidden if reset && actor.staff_master.role_code != "owner"
        raise WrongPassword unless actor.authenticate(attributes[:current_password])

        subject.reload
        master = subject.staff_master.reload
        master.lock_version = expected_version unless expected_version.nil?
        # 認証情報の更新と担当者の管理画面用の版・監査記録を一体で保存する。
        master.touch
        subject.update!(password: attributes[:password], password_confirmation: attributes[:password_confirmation])
        subject.staff_sessions.delete_all
        SecurityAuditEvent.create!(actor: actor, subject: subject, action: reset ? "password_reset" : "password_change")
      end
    end
  end
end
