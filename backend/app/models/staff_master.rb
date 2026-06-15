class StaffMaster < ApplicationRecord
  has_one :staff, dependent: :destroy
  ROLE_CODES = %w[owner operator viewer].freeze

  # コード、名前、役割コード、雇用開始日は必須であることをバリデーション
  validates :name, presence: true
  validates :role_code,
            presence: true,
            inclusion: { in: ROLE_CODES}

  validates :employment_started_on, presence: true
  validates :code, presence: true, uniqueness: true

  # 退職日は、雇用開始日以降であることをバリデーション
  validate :retired_on_must_be_on_or_after_employment_started_on
  
  scope :active, -> { where(retired_on: nil) }
  scope :retired, -> { where.not(retired_on: nil) }
  scope :ordered, -> { order(:id) }

  # 退職していないかどうかを判断するメソッド
  def active?
    retired_on.blank?
  end

  # 退職しているかどうかを判断するメソッド
  def retired?
    retired_on.present?
  end

  private
  
  def retired_on_must_be_on_or_after_employment_started_on
    return if retired_on.blank?
    return if employment_started_on.blank?
    return if retired_on >= employment_started_on

    errors.add(
      :retired_on,
      "は雇用開始日以降の日付を指定してください"
    )
  end
end
