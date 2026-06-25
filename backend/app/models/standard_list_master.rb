class StandardListMaster < ApplicationRecord
  belongs_to :standard_master

  has_many :restaurant_tables,
            class_name: "RestaurantTable",
            foreign_key: :restaurant_table_type_id,
            inverse_of: :restaurant_table_type,
            dependent: :restrict_with_error
            
  # バリデーション（入力チェック）
  validates :label, presence: true
  validates :position,
            presence: true,
            numericality: { only_integer: true }
  validates :active, inclusion: { in: [true, false] }
  
  # 共通の検索条件
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }

end
