class RestaurantMaster < ApplicationRecord
  CODE_FORMAT = /\A[A-Z]+\d{2,}\z/

  belongs_to :restaurant_master_type,
              class_name: "StandardListMaster",
              foreign_key: :restaurant_master_type_id,
              inverse_of: :restaurant_masters

  belongs_to :created_by_staff,
              class_name: "Staff",
              foreign_key: :created_by_staff_id,
              inverse_of: :created_restaurant_masters

  belongs_to :updated_by_staff,
              class_name: "Staff",
              foreign_key: :updated_by_staff_id,
              inverse_of: :updated_restaurant_masters

  # 登録後は変更不可
  attr_readonly :restaurant_master_type_id,
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
              scope: :restaurant_master_type_id
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
            inclusion: { in: [ true, false ] }

  # 予約作成・更新・復元と同じロックを、検証から席の保存まで保持する。
  before_validation -> { Reservations::WriteLock.acquire! }, on: :update
  validate :capacity_must_cover_existing_reservations

  before_validation :normalize_editable_attributes

  scope :active, -> { where(active: true) }
  scope :ordered, lambda {
    joins(:restaurant_master_type)
      .order(
        "standard_list_masters.code ASC",
        sequence_number: :asc
      )
  }

  private

  def capacity_must_cover_existing_reservations
    return unless persisted? && will_save_change_to_capacity?
    return unless capacity.is_a?(Integer) && capacity.positive? && capacity < capacity_in_database

    affected_ids = Reservation.active.where(completed_at: nil)
      .where("ends_at > ?", Time.current)
      .joins(:reservation_tables)
      .where(reservation_tables: { restaurant_master_id: id })
      .select do |reservation|
        other_capacity = reservation.restaurant_masters.where.not(id: id).sum(:capacity)
        other_capacity + capacity < reservation.guest_count
      end.map(&:id)
    return if affected_ids.empty?

    errors.add(:capacity, "は予約ID #{affected_ids.join(', ')}の人数を満たしません。先に予約席を変更してください")
  end

  def normalize_editable_attributes
    self.name = name.to_s.strip
    self.memo = memo.to_s.strip.presence
  end
end
