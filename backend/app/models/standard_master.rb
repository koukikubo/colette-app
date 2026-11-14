class StandardMaster < ApplicationRecord
  before_validation -> { Rf::ConfigurationLock.acquire! }, on: :update
  validate :keep_used_rf_ranks_active

  has_many :standard_list_masters, dependent: :destroy

  # バリデーション（入力チェック）
  validates :name, presence: true
  validates :position,
            presence: true,
            numericality: { only_integer: true }

  validates :active, inclusion: { in: [ true, false ] }

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }

  # 共通の検索条件
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }

  # 検索メソッド(遅延評価:条件に一致しているものだけを返す)
  def self.search(query: nil, active: nil)
    result = all

    if query.present?
      result = result.where(
        "name LIKE :q OR description LIKE :q",
        q: "%#{query}%"
      )
    end

    case active
    when "true", true
      result = result.where(active: true)
    when "false", false
      result = result.where(active: false)
    end

    result
  end
  def keep_used_rf_ranks_active
    return unless persisted? && will_save_change_to_active? && !active?
    return unless Rf::RankAvailability.used?(standard_list_masters.pluck(:id))

    errors.add(:active, "は使用中のRFルールから参照されています。先にルールを切り替えてください")
  end
end
