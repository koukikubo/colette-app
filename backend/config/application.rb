require_relative "boot"

require "rails/all"
Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    config.load_defaults 8.1
    config.autoload_lib(ignore: %w[assets tasks])
    config.time_zone = "Asia/Tokyo"
    config.api_only = true

    config.session_store :cookie_store,
                        key: "_colette_session",
                        same_site: :lax,
                        httponly: true

    config.middleware.use ActionDispatch::Cookies
    config.middleware.use config.session_store, config.session_options
    config.i18n.default_locale = :ja
    config.i18n.available_locales = %i[ja]

  end
end
