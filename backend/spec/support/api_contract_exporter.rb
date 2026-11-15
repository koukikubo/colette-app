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
  discriminators = %w[status role_code customer_kind exclusion_reason monthly_apply_state execution_source category from_state to_state].freeze
  signature = nil
  signature = lambda do |value, key = nil|
    case value
    when Hash then value.sort.to_h.transform_keys(&:to_s).map { |name, item| [ name, signature.call(item, name) ] }.to_h
    when Array then value.map { |item| signature.call(item) }.uniq.sort_by(&:to_s)
    when String then discriminators.include?(key) ? value : "string"
    when Numeric then "number"
    when TrueClass, FalseClass then "boolean"
    when NilClass then "null"
    end
  end

  RSpec.configure do |config|
    config.after(:each, type: :request) do |example|
      next if example.exception || response.nil? || request.nil?
      next unless request.path.match?(%r{\A/api/v1/(?:customers|reservation(?:s|_calendar)|restaurant_master|staff|standard_masters|rf_|dashboard)})
      next unless response.media_type == "application/json" && response.body.present?

      body = JSON.parse(response.body)
      path = request.path.gsub(%r{/\d+(?=/|$)}, "/:id")
      shape = [ request.method, path, response.status, signature.call(body) ]
      key = Digest::SHA256.hexdigest(JSON.generate(shape))
      contract_mutex.synchronize do
        contract_samples[key] ||= { method: request.method, path: path, status: response.status,
                                  source: example.location, body: body }
      end
    end
    config.after(:suite) do
      FileUtils.mkdir_p(contract_output.dirname)
      File.write(contract_output, JSON.pretty_generate(version: 1, samples: contract_samples.sort.to_h.values), mode: "w", perm: 0o600)
      puts "API contract samples: #{contract_samples.size} -> #{contract_output}"
    end
  end
end
