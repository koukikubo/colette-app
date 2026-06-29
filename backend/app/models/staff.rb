class Staff < ApplicationRecord
  belongs_to :staff_master
  has_many :created_customers,
            class_name: "Customer",
            foreign_key: :created_by_staff_id,
            inverse_of: :created_by_staff

  has_many :updated_customers,
            class_name: "Customer",
            foreign_key: :updated_by_staff_id,
            inverse_of: :updated_by_staff

  has_many :created_restaurant_masters,
            class_name: "RestaurantMaster",
            foreign_key: :created_by_staff_id,
            inverse_of: :created_by_staff,
            dependent: :restrict_with_error

  has_many :updated_restaurant_masters,
            class_name: "RestaurantMaster",
            foreign_key: :updated_by_staff_id,
            inverse_of: :updated_by_staff,
            dependent: :restrict_with_error

  has_secure_password

  MAX_FAILED_ATTEMPTS = 30


  # staff_master_idは一意である必要があるため、バリデーションを追加
  validates :staff_master_id, uniqueness: true
  validates :login_enabled, inclusion: { in: [true, false] }
  validates :failed_attempts,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0
            }

  # staff_masterのactive?メソッドを呼び出すための委譲
  delegate :code,
           :name,
           :role_code,
           :employment_started_on,
           :retired_on,
           to: :staff_master,
           prefix: true

  # ログインが許可されているかどうかを判断するメソッド
  def login_allowed?
    login_enabled? &&
    !locked? && 
    staff_master.active?
  end

  # アカウントがロックされているかどうかを判断するメソッド
  def locked?
    locked_at.present?
  end

  # ログイン失敗を記録するメソッド
  def record_login_failure!
    with_lock do
      self.failed_attempts += 1

      if failed_attempts >= MAX_FAILED_ATTEMPTS
        self.locked_at ||= Time.current
      end

      save!
    end
  end

  # ログイン成功を記録するメソッド
  def record_login_success!
    update!(
      failed_attempts: 0,
      last_logged_in_at: Time.current
    )
  end

  # アカウントをロック解除するメソッド
  def unlock!
    update!(
      failed_attempts: 0,
      locked_at: nil
    )
  end
end
