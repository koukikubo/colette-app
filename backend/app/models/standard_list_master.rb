class StandardListMaster < ApplicationRecord
  belongs_to :standard_master

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

    result
  end

end
