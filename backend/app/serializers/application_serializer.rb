class ApplicationSerializer
  # シリアライザの基底クラス
  attr_reader :resource
  # シリアライズ対象のリソースを返す
  def self.collection(resources)
    resources.map do |resource|
      new(resource).as_json
    end
  end
  # シリアライズ対象のリソースを返す
  def initialize(resource)
    @resource = resource
  end

  private
  # スタッフ情報をシリアライズする
  def serialize_staff(staff)
    return nil if staff.blank?

    {
      id: staff.id,
      staff_master_id: staff.staff_master_id,
      name: staff.staff_master&.name
    }
  end
end
