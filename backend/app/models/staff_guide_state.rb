class StaffGuideState < ApplicationRecord
  CURRENT_VERSION = 1
  belongs_to :staff
  validates :guide_version, numericality: { only_integer: true, greater_than: 0 }
  validates :status, inclusion: { in: %w[completed skipped] }
  # 初回の同時保存はDBの一意制約、保存後の単調な状態遷移は行ロックで守る。
  def self.record_outcome!(staff:, status:)
    transaction do
      state = create_or_find_by!(staff: staff, guide_version: CURRENT_VERSION) { |record| record.status = status }
      state.with_lock { state.update!(status: status) unless state.status == "completed" }
      state
    end
  end
end
