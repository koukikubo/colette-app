class StandardMaster < ApplicationRecord
  has_many :standard_list_masters, dependent: :destroy

  # バリデーション（入力チェック）
  with_options presence: true do
      validates :position,
                numericality: { only_integer: true }
      validates :active, inclusion: { in: [true, false] }
      validates :name
  end

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

end
