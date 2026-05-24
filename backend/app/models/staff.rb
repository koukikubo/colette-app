class Staff < ApplicationRecord
  belongs_to :staff_master

  has_secure_password

  # staff_master_idは一意である必要があるため、バリデーションを追加
  validates :staff_master_id, uniqueness: true
  validates :login_enabled, inclusion: { in: [true, false] }
  validates :failed_attempts,
            numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  # staff_masterのactive?メソッドを呼び出すためのdelegate
  delegate :code,
           :name,
           :role_code,
           :employment_started_on,
           :retired_on,
           to: :staff_master,
           prefix: true

  # ログインが許可されているかどうかを判断するメソッド
  def login_allowed?
    login_enabled? && staff_master.active?
  end
end
