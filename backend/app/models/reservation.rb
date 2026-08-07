class Reservation < ApplicationRecord
  OPENING_HOUR = 17
  LAST_RESERVATION_START_HOUR = 21

  belongs_to :customer,
            optional: true

  belongs_to :requested_restaurant_master_type,
            class_name: "StandardListMaster"

  belongs_to :reservation_status,
            class_name: "StandardListMaster"

  belongs_to :reservation_route,
            class_name: "StandardListMaster",
            optional: true

  belongs_to :menu_type,
            class_name: "StandardListMaster",
            optional: true

  belongs_to :occasion,
            class_name: "StandardListMaster",
            optional: true

  belongs_to :created_by_staff,
            class_name: "Staff"

  belongs_to :updated_by_staff,
            class_name: "Staff"

  has_many :reservation_tables,
          dependent: :destroy

  has_many :restaurant_masters,
          through: :reservation_tables

  # 入力チェック
  validates :reservation_name,
            presence: true,
            length: { maximum: 50 }

  validates :reservation_phone_number,
            presence: true,
            length: { maximum: 20 }

  validates :starts_at,
            presence: true

  validates :ends_at,
            presence: true

  validate :ends_at_must_be_after_starts_at
  validate :reservation_time_must_be_within_business_hours

  validates :guest_count,
            presence: true,
            numericality: {
              only_integer: true,
              greater_than: 0
            }

  validates :requested_restaurant_master_type,
          standard_list_category: {
            system_key: "restaurant_master_type"
          }

  validates :reservation_status,
            standard_list_category: true

  validates :reservation_route,
            standard_list_category: true

  validates :menu_type,
            standard_list_category: {
              system_key: "reservation_menu_type"
            }

  validates :occasion,
            standard_list_category: {
              system_key: "reservation_occasion"
            }


  # 検索に使用するスコープ
  scope :ordered, -> { order(:starts_at, :id) }

  scope :on_date, lambda { |date|
    target_date = date.to_date

    where(
      starts_at: target_date.beginning_of_day...target_date.next_day.beginning_of_day
    )
  }
  # アクティブな予約のみを取得するスコープ
  scope :active, -> { where(canceled_at: nil) }
  # キャンセル済みの予約のみを取得するスコープ
  scope :canceled, -> { where.not(canceled_at: nil) }
  # 予約名または電話番号で検索するスコープ
  scope :search_by_keyword, lambda { |keyword|
    normalized_keyword = keyword.to_s.strip
    normalized_phone = normalized_keyword.gsub(/[^\d]/, "")

    if normalized_keyword.blank?
      all
    elsif normalized_phone.present?
      where(
        "reservation_name ILIKE :keyword OR reservation_phone_number LIKE :phone",
        keyword: "%#{sanitize_sql_like(normalized_keyword)}%",
        phone: "%#{normalized_phone}%"
      )
    else
      where(
        "reservation_name ILIKE :keyword",
        keyword: "%#{sanitize_sql_like(normalized_keyword)}%"
      )
    end
  }

  private
  # starts_atよりends_atが前の場合はエラーにする
  def ends_at_must_be_after_starts_at
    return if starts_at.blank? || ends_at.blank?
    return if ends_at > starts_at

    errors.add(:ends_at, "must be after starts_at")
  end

  def reservation_time_must_be_within_business_hours
    return if starts_at.blank? || ends_at.blank?

    reservation_date = starts_at.in_time_zone.to_date

    opening_at = Time.zone.local(
      reservation_date.year,
      reservation_date.month,
      reservation_date.day,
      OPENING_HOUR
    )

    last_start_at = Time.zone.local(
      reservation_date.year,
      reservation_date.month,
      reservation_date.day,
      LAST_RESERVATION_START_HOUR
    )

    closing_at = reservation_date.next_day.beginning_of_day
    # 予約開始時間が営業時間外の場合はエラーにする（17:00~21:00）
    unless starts_at.between?(opening_at, last_start_at)
      errors.add(:starts_at, :outside_business_hours)
    end

    if ends_at > closing_at
      errors.add(:ends_at, :outside_business_hours)
    end
  end

end
