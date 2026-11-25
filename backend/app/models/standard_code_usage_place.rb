# 利用先の定義。追加先の画面・保存処理を接続する際に定義を増やせる。
class StandardCodeUsagePlace < ApplicationRecord
  validates :key, :name, :position, presence: true
  validates :key, uniqueness: true
  scope :ordered, -> { order(:position, :id) }
end
