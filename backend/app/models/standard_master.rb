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


end
