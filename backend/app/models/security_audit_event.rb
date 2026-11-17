class SecurityAuditEvent < ApplicationRecord
  # パスワード・入力本文は記録せず、誰が誰の認証情報を変更したかを残す。
  belongs_to :actor, class_name: "Staff"
  belongs_to :subject, class_name: "Staff"
  validates :action, inclusion: { in: %w[password_change password_reset] }
end
