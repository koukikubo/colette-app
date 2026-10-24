class StandardListMaster < ApplicationRecord
  RF_RANK_FALLBACK_COLOR = "#64748B".freeze

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
  validates :display_color, :initial_display_color,
          format: {
            with: /\A#[0-9A-Fa-f]{6}\z/,
            message: "は#RRGGBB形式で入力してください"
          },
          allow_nil: true

  before_validation :set_initial_rf_rank_color, on: :create

  # 共通の検索条件
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }
  scope :active_rf_ranks, -> {
    joins(:standard_master).where(
      active: true,
      standard_masters: { system_key: "rf_rank", active: true }
    )
  }

  def display_code
    id.to_s.rjust(5, "0")
  end

  def default_display_color
    return nil unless standard_master&.system_key == "rf_rank"

    initial_display_color || RF_RANK_FALLBACK_COLOR
  end

  private

  def set_initial_rf_rank_color
    return unless standard_master&.system_key == "rf_rank"

    self.initial_display_color ||= display_color || RF_RANK_FALLBACK_COLOR
  end
end
