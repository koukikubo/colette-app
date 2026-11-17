require "rails_helper"
require "open3"
require "tempfile"

RSpec.describe "API契約の実レスポンス収集" do
  it "同じexample内の途中のレスポンスも最終レスポンスと一緒に収集する" do
    FileUtils.mkdir_p(Rails.root.join("tmp"))
    Tempfile.create([ "contract-export-regression-", ".json" ], Rails.root.join("tmp")) do |output|
      relative_path = Pathname.new(output.path).relative_path_from(Rails.root).to_s
      stdout, stderr, status = Open3.capture3(
        { "API_CONTRACT_EXPORT" => relative_path },
        RbConfig.ruby, Gem.bin_path("rspec-core", "rspec"),
        "spec/requests/api/v1/password_management_spec.rb", chdir: Rails.root.to_s
      )
      expect(status.success?).to be(true), "#{stdout}\n#{stderr}"
      samples = JSON.parse(File.read(output.path)).fetch("samples")
      # 本人のパスワード変更は成功の直後にセッション失効確認のGETを行う。
      # 最終レスポンスのみを記録する方式では、この200と422が検査から消える。
      password_responses = samples.select { |sample| sample["method"] == "PATCH" && sample["path"] == "/api/v1/staff/password" }
      expect(password_responses.map { |sample| sample["status"] }).to include(200, 422)
      expect(samples).to include(a_hash_including("method" => "GET", "path" => "/api/v1/staff/current", "status" => 401))
    end
  end
end
