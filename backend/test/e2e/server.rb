require_relative "guard"
# RSpec用のCSRF無効化・Job保留を引き継がず、HTTPと非同期計算を実行する。
Rails.application.config.action_controller.allow_forgery_protection = true
ActionController::Base.allow_forgery_protection = true
ActiveJob::Base.queue_adapter = :async
require "rails/command"
require "rails/commands/server/server_command"
Rails::Server.new(
  app: Rails.application, config: Rails.root.join("config.ru").to_s, server: "puma",
  Port: Integer(ENV.fetch("E2E_RAILS_PORT", "4101")), Host: "0.0.0.0",
  pid: "/tmp/colette-core-e2e-server.pid", environment: "test", log_stdout: true
).start
