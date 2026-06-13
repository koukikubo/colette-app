class ApplicationSerializer
  # シリアライザの基底クラス
  attr_reader :record

  def initialize(record)
    @record = record
  end
end