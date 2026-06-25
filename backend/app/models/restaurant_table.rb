class RestaurantTable < ApplicationRecord
  CODE_FORMAT = /\A[A-Z]+\d{2,}\z/

  belongs_to :restaurant_table_type,
              class_name: "StandardListMaster",
              foreign_key: :restaurant_table_type_id,
              inverse_of: :restaurant_tables

  belongs_to :created_by_staff,
              class_name: "Staff",
              foreign_key: :created_by_staff_id,
              inverse_of: :created_restaurant_tables

  belongs_to :updated_by_staff,
              class_name: "Staff",
              foreign_key: :updated_by_staff_id,
              inverse_of: :updated_restaurant_tables

  # 登録後は変更不可
  attr_readonly :restaurant_table_type_id,
                :sequence_number,
                :code

  # Rails側で自動生成された値を検証する
  validates :code,
            presence: true,
            length: { maximum: 20 },
            format: {
              with: CODE_FORMAT,
              message: "の形式が正しくありません"
            },
            uniqueness: true

  validates :sequence_number,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than: 0
            },
            uniqueness: {
              scope: :restaurant_table_type_id
            }

  validates :name,
            presence: true,
            length: { maximum: 100 }

  validates :capacity,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than: 0
            }

  validates :position,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than_or_equal_to: 0
            }

  validates :active,
            inclusion: { in: [true, false] }

  before_validation :normalize_editable_attributes

  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }

  private

  def normalize_editable_attributes
    self.name = name.to_s.strip
    self.memo = memo.to_s.strip.presence
  end
end