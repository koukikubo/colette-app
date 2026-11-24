class StandardMaster < ApplicationRecord
  before_validation -> { Rf::ConfigurationLock.acquire! }, on: :update
  before_validation -> { Customers::DetailConfigurationLock.acquire! }
  validate :validate_customer_detail_configuration
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
  # 店舗独自項目だけを公開し、保存済みの複数回答を設定変更で破壊しない。
  def validate_customer_detail_configuration
    unless %w[none single multiple].include?(customer_detail_mode)
      errors.add(:customer_detail_mode, "が不正です")
      return
    end
    errors.add(:customer_detail_group, "は50文字以内です") if customer_detail_group.to_s.length > 50
    return if customer_detail_mode == "none"

    errors.add(:customer_detail_mode, "は業務用コードには設定できません") if system_key.present?
    if StandardMaster.where.not(customer_detail_mode: "none").where.not(id: id).count >= 1000
      errors.add(:customer_detail_mode, "は最大1000項目です")
    end
    if persisted? && will_save_change_to_customer_detail_mode? && customer_detail_mode == "single" &&
        CustomerDetailSelection.where(standard_list_master_id: standard_list_masters.select(:id))
          .group(:customer_id).having("COUNT(*) > 1").exists?
      errors.add(:customer_detail_mode, "には複数回答があります。単一選択へ変更できません")
    end
  end

  def keep_used_rf_ranks_active
    return unless persisted? && will_save_change_to_active? && !active?
    return unless Rf::RankAvailability.used?(standard_list_masters.pluck(:id))

    errors.add(:active, "は使用中のRFルールから参照されています。先にルールを切り替えてください")
  end
end
