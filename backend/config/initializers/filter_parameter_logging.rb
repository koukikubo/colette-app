# Be sure to restart your server when you modify this file.

# Configure parameters to be partially matched (e.g. passw matches password) and filtered from the log file.
# Use this to limit dissemination of sensitive information.
# See the ActiveSupport::ParameterFilter documentation for supported notations and behaviors.
Rails.application.config.filter_parameters += [
  :passw, :email, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn, :cvv, :cvc
]

# 顧客・予約の入力と検索語は、ネスト内も含めてログへ保存しない。
Rails.application.config.filter_parameters += [
  :name, :kana, :phone, :address, :postal, :birthday, :memo, :note,
  :query, :keyword, :search, :company
]
