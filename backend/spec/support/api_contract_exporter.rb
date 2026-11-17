# 明示指定されたtest実行だけ、実ControllerのHTTPレスポンスをフロント契約検査へ渡す。
# パスワード等の入力、Cookie、CSRFトークンは書き出さない。
if ENV["API_CONTRACT_EXPORT"].present?
  require "digest"
  require "fileutils"
  require "json"

  abort "Contract export requires test environment" unless Rails.env.test?
  unless ActiveRecord::Base.connection_db_config.database.to_s.match?(/(?:_test|_e2e)(?:_|$)/)
    abort "Contract export requires a dedicated test database"
  end
  contract_output = Rails.root.join(ENV.fetch("API_CONTRACT_EXPORT")).expand_path
  unless contract_output.to_s.start_with?(Rails.root.join("tmp").to_s + "/")
    abort "Contract output must be inside backend/tmp"
  end
  contract_samples = {}
  contract_mutex = Mutex.new
  require_relative "api_contract_signature"

  # example終了時のresponseは最後の1件だけ。Integration Sessionで各HTTP完了直後に採取する。
  capture_response = lambda do |session|
    example = RSpec.current_example
    next unless example && example.metadata[:type] == :request
    request = session.request
    response = session.response
    next if response.nil? || request.nil?
    next unless request.path.match?(%r{\A/api/v1/(?:customers|reservation(?:s|_calendar)|restaurant_master|staff|standard_masters|rf_|dashboard)})
    next unless response.media_type == "application/json" && response.body.present?

    body = JSON.parse(response.body)
    path = request.path.gsub(%r{/\d+(?=/|$)}, "/:id")
    shape = [ request.method, path, response.status, ApiContractSignature.call(body) ]
    key = Digest::SHA256.hexdigest(JSON.generate(shape))
    samples = example.metadata[:api_contract_samples] ||= {}
    samples[key] ||= { method: request.method, path: path, status: response.status,
                      source: example.location, body: body }
  end
  request_recorder = Module.new do
    define_method(:process) do |*args, **kwargs|
      result = super(*args, **kwargs)
      capture_response.call(self)
      result
    end
  end
  ActionDispatch::Integration::Session.prepend(request_recorder)

  RSpec.configure do |config|
    config.after(:each, type: :request) do |example|
      samples = example.metadata.delete(:api_contract_samples)
      # 失敗したexampleの不完全な結果は契約の根拠に使わない。
      next if example.exception || samples.nil?
      contract_mutex.synchronize { contract_samples.merge!(samples) }
    end
    config.after(:suite) do
      FileUtils.mkdir_p(contract_output.dirname)
      File.write(contract_output, JSON.pretty_generate(version: 1, samples: contract_samples.sort.to_h.values), mode: "w", perm: 0o600)
      puts "API contract samples: #{contract_samples.size} -> #{contract_output}"
    end
  end
end
