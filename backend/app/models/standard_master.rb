class StandardMaster < ApplicationRecord
  has_many :standard_list_masters, dependent: :destroy

  # バリデーション（入力チェック）
  with_options presence: true do
      validates :code, uniqueness: true
      validates :name
      validates :position,
                numericality: { only_integer: true }
  end
  # 共通の検索条件
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }

  # 検索メソッド(遅延評価:条件に一致しているものだけを返す)
  def self.search(query: nil, active: nil)
    result = all

    if query.present?
      result = result.where(
        "code LIKE :q OR name LIKE :q",
        q: "%#{query}%"
      )
    end

    unless active.nil?
      result = result.where(active: active)
    end

    case active
    when "true", true
      result = result.where(active: true)
    when "false", false
      result = result.where(active: false)
    end

    result
  end

  def self.next_code
    max_code = maximum(Arel.sql("CAST(code AS INTEGER)")) || 0
    format("%04d", max_code + 1)
  end

end
