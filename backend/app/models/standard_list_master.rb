class StandardListMaster < ApplicationRecord
  belongs_to :standard_master

  # バリデーション（入力チェック）
  with_options presence: true do
    validates :code, presence: true, uniqueness: true
    validates :label
    validates :position,
              numericality: { only_integer: true }
  end

  # 共通の検索条件
  scope :active, -> { where(active: true) }
  scope :ordered, -> { order(:position, :id) }

  def self.next_code_for(standard_master)
    max_code =
      standard_master
      .standard_list_masters
      .maximum(Arel.sql("CAST(code AS INTEGER)")) || 0

    format("%05d", max_code + 1)
  end
end
