class StandardListMaster < ApplicationRecord
  # RFランクのデフォルトカラー
  RF_RANK_DEFAULT_COLORS = {
    "A" => "#059669",
    "B" => "#0D9488",
    "C" => "#2563EB",
    "D" => "#D97706",
    "E" => "#EA580C",
    "Z" => "#64748B",
    "N" => "#94A3B8"
  }.freeze

  belongs_to :standard_master

  has_many :restaurant_masters,
            class_name: "RestaurantMaster",
            foreign_key: :restaurant_master_type_id,
            inverse_of: :restaurant_master_type,
            dependent: :restrict_with_error

  # バリデーション（入力チェック）
  validates :label, presence: true
  validates :position,
            presence: true,
            numericality: { only_integer: true }
  validates :active, inclusion: { in: [ true, false ] }
  validates :display_color,
          format: {
            with: /\A#[0-9A-Fa-f]{6}\z/,
            message: "は#RRGGBB形式で入力してください"
          },
          allow_nil: true

  validate :rf_rank_code_must_not_change, on: :update

  # 共通の検索条件
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }

  def default_display_color
    return nil unless standard_master&.system_key == "rf_rank"

    RF_RANK_DEFAULT_COLORS.fetch(code, "#64748B")
  end

  private

  def rf_rank_code_must_not_change
    return unless standard_master&.system_key == "rf_rank"
    return unless will_save_change_to_code?

    errors.add(
      :code,
      "はRFランクの内部識別子のため変更できません"
    )
  end
end
