class ApplicationSerializer
  # シリアライザの基底クラス
  attr_reader :resource

  def initialize(resource)
    @resource = resource
  end
end