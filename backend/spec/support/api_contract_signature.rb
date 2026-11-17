# 契約サンプルの重複排除に使う署名。テスト専用で本番には読み込まない。
module ApiContractSignature
  def self.call(value)
    case value
    when Hash then value.sort.to_h.transform_keys(&:to_s).map { |name, item| [ name, call(item) ] }.to_h
    when Array then [ "array", value.map { |item| call(item) }.uniq.sort_by(&:to_s) ]
    # enumの一覧に依存せず全ての文字列値を保持し、新しい状態値も検査へ渡す。
    when String then [ "string", value ]
    when Numeric then [ "number" ]
    when TrueClass, FalseClass then [ "boolean" ]
    when NilClass then [ "null" ]
    end
  end
end
