class StaffMaster < ApplicationRecord
  has_one :staff, dependent: :destroy

  # コード、名前、役割コード、雇用開始日は必須であることをバリデーション
  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :role_code, presence: true
  validates :employment_started_on, presence: true

  # 退職日は、雇用開始日以降であることをバリデーション
  scope :active, -> { where(retired_on: nil) }
  scope :retired_on, -> { where.not(retired_on: nil) }
  scope :ordered, -> { order(:code) }

  # 退職していないかどうかを判断するメソッド
  def active?
    retired_on.blank?
  end

  # 退職しているかどうかを判断するメソッド
  def retired?
    retired_on.present?
  end
end
