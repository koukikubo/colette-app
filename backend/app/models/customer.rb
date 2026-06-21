class Customer < ApplicationRecord
  before_validation :normalize_customer_attributes

  CUSTOMER_KINDS = %w[individual corporate].freeze

  KANA_FORMAT = /\A[ァ-ヶー・ 　]+\z/
  POSTAL_CODE_FORMAT = /\A\d{7}\z/
  PHONE_NUMBER_FORMAT = /\A\d{10,11}\z/

  belongs_to :created_by_staff,
              class_name: "Staff",
              foreign_key: :created_by_staff_id,
              inverse_of: :created_customers

  belongs_to :updated_by_staff,
              class_name: "Staff",
              foreign_key: :updated_by_staff_id,
              inverse_of: :updated_customers

  validates :customer_kind,
            presence: true,
            inclusion: { in: CUSTOMER_KINDS }

  validates :name, :kana,
            presence: true,
            length: { maximum: 30 }

  validates :kana, :company_name_kana,
            format: {
              with: KANA_FORMAT,
              message: "は全角カタカナで入力してください"
            },
            allow_blank: true

  validates :company_name, :company_name_kana,
            length: { maximum: 100 },
            allow_blank: true

  validates :postal_code, :company_postal_code,
            format: {
              with: POSTAL_CODE_FORMAT,
              message: "は7桁の数字で入力してください"
            },
            allow_blank: true

  validates :phone_number, :company_phone_number,
            format: {
              with: PHONE_NUMBER_FORMAT,
              message: "は10桁または11桁の数字で入力してください"
            },
            allow_blank: true

  validates :email, :company_email,
            format: {
              with: URI::MailTo::EMAIL_REGEXP,
              message: "の形式が正しくありません"
            },
            length: { maximum: 255 },
            allow_blank: true

  validates :address, :company_address,
            length: { maximum: 255 },
            allow_blank: true

  validate :birthday_must_not_be_in_the_future

  private

  def birthday_must_not_be_in_the_future
    return if birthday.blank? || birthday <= Date.current

    errors.add(:birthday, "に未来の日付は指定できません")
  end

  def normalize_customer_attributes
    self.name = name.to_s.strip
    self.kana = kana.to_s.strip

    self.email = normalize_email(email)
    self.company_email = normalize_email(company_email)

    self.postal_code = normalize_digits(postal_code)
    self.company_postal_code = normalize_digits(company_postal_code)

    self.phone_number = normalize_digits(phone_number)
    self.company_phone_number = normalize_digits(company_phone_number)

    self.company_name = company_name.to_s.strip.presence
    self.company_name_kana = company_name_kana.to_s.strip.presence
    self.address = address.to_s.strip.presence
    self.company_address = company_address.to_s.strip.presence
    self.memo = memo.to_s.strip.presence
  end

  def normalize_digits(value)
    value
        .to_s
        .tr("０-９", "0-9")
        .gsub(/[\s\-ー－()（）]/, "")
        .presence
  end

  def normalize_email(value)
    value.to_s.strip.downcase.presence
  end
end

