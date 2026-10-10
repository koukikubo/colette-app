class StandardListMaster < ApplicationRecord
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

  # 共通の検索条件
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }
end
