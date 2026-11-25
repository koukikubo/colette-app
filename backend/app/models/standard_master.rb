class StandardMaster < ApplicationRecord
  before_validation -> { Rf::ConfigurationLock.acquire! }, on: :update
  before_validation -> { StandardCodes::ConfigurationLock.acquire! }
  before_validation :sync_legacy_customer_detail_settings
  validate :validate_usage_configuration
  validate :validate_record_limit, on: :create

  MAX_RECORDS = 99_999
  belongs_to :usage_place, class_name: "StandardCodeUsagePlace", optional: true
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
  # 旧APIの顧客専用設定は互換窓口として残す。保存・検索の正本は共通設定。
  def customer_detail?
    usage_place&.key == "customer_details"
  end

  def customer_detail_mode
    customer_detail? ? input_type : "none"
  end

  def customer_detail_mode=(value)
    if value == "none"
      self.usage_place = nil if customer_detail?
    else
      self.usage_place = StandardCodeUsagePlace.find_by!(key: "customer_details")
      self.input_type = value
    end
  end

  def customer_detail_group
    input_group
  end

  def customer_detail_group=(value)
    self.input_group = value
  end

  private

  # 切戻し・旧クライアント用の列も同じトランザクションで同期する。
  def sync_legacy_customer_detail_settings
    self[:customer_detail_mode] = customer_detail_mode
    self[:customer_detail_group] = input_group
  end

  def validate_record_limit
    errors.add(:base, "基本コードは最大99,999件です") if StandardMaster.count >= MAX_RECORDS
  end

  # 用途を外しても回答は保持する。複数回答を単一設定へ変えて隠さない。
  def validate_usage_configuration
    errors.add(:input_type, "が不正です") unless %w[single multiple].include?(input_type)
    errors.add(:input_group, "は50文字以内です") if input_group.to_s.length > 50
    errors.add(:usage_place, "は業務用コードには設定できません") if usage_place_id.present? && system_key.present?
    if usage_place_id.present? && usage_place.nil?
      errors.add(:usage_place, "が見つかりません")
    end
    if persisted? && (will_save_change_to_input_type? || will_save_change_to_usage_place_id?) && input_type == "single" &&
        CustomerDetailSelection.where(standard_list_master_id: standard_list_masters.select(:id))
          .group(:customer_id).having("COUNT(*) > 1").exists?
      errors.add(:input_type, "には複数回答があります。単一選択へ変更できません")
    end
  end

  def keep_used_rf_ranks_active
    return unless persisted? && will_save_change_to_active? && !active?
    return unless Rf::RankAvailability.used?(standard_list_masters.pluck(:id))

    errors.add(:active, "は使用中のRFルールから参照されています。先にルールを切り替えてください")
  end
end
