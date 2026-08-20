class StandardListCategoryValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.nil?
    # options[:system_key]が指定されていない場合は、attribute名を使用する
    expected_system_key =
      options[:system_key] || attribute.to_s
    # valueのstandard_masterのsystem_keyがexpected_system_keyと一致するかを確認
    return if value.standard_master.system_key == expected_system_key
    # 一致しない場合はエラーを追加
    record.errors.add(attribute, :invalid_category)
  end
end
