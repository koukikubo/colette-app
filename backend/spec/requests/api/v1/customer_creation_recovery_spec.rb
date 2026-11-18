require "rails_helper"

RSpec.describe "顧客登録の再送と結果確認", type: :request do
  include_context "authenticated request"
  let(:key) { "customer-recovery-key-1234" }
  let(:attributes) { { name: "再送確認", kana: "サイソウカクニン", customer_kind: "individual" } }
  before { login! }

  def submit_customer(values = attributes, request_key = key)
    headers = authenticated_headers.merge("Idempotency-Key" => request_key)
    post "/api/v1/customers", params: { customer: values }, headers: headers, as: :json
  end

  it "成功応答を失って同じ登録を再送しても同じ顧客だけを返す" do
    submit_customer
    expect(response).to have_http_status(:created)
    original_id = response.parsed_body.dig("data", "customer", "id")
    expect { submit_customer }.not_to change(Customer, :count)
    expect(response).to have_http_status(:created)
    expect(response.parsed_body.dig("data", "customer", "id")).to eq(original_id)
  end

  it "登録済みのキーで入力を変えても別顧客を作らない" do
    submit_customer
    expect { submit_customer(attributes.merge(name: "別の入力")) }.not_to change(Customer, :count)
    expect(response).to have_http_status(:conflict)
    expect(response.parsed_body["code"]).to eq("idempotency_conflict")
  end

  it "キー未指定を拒否する" do
    expect { submit_customer(attributes, nil) }.not_to change(Customer, :count)
    expect(response).to have_http_status(:bad_request)
  end

  it "バリデーション失敗後は同じキーで修正して登録できる" do
    submit_customer(attributes.merge(name: ""))
    expect(response).to have_http_status(:unprocessable_content)
    submit_customer
    expect(response).to have_http_status(:created)
  end

  it "リロード後は書き込みなしで登録結果を確認できる" do
    submit_customer
    id = response.parsed_body.dig("data", "customer", "id")
    expect {
      get "/api/v1/customers/creation_result", headers: { "Idempotency-Key" => key }
    }.not_to change(Customer, :count)
    expect(response).to have_http_status(:ok)
    expect(response.parsed_body.dig("data", "customer", "id")).to eq(id)
    expect(response.headers["Cache-Control"]).to include("no-store")
  end

  it "まだ届いていない操作は未確認として返す" do
    get "/api/v1/customers/creation_result", headers: { "Idempotency-Key" => key }
    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body["code"]).to eq("creation_not_found")
  end
  it "他の担当者の送信キーで登録結果を取得できない" do
    other = create(:staff)
    customer = create(:customer)
    CustomerCreationRequest.create!(staff: other, customer: customer, key_digest: CreationRequestKey.digest(key), request_digest: "a" * 64)
    get "/api/v1/customers/creation_result", headers: { "Idempotency-Key" => key }
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include(customer.name)
  end

  it "再送履歴の保存に失敗したら顧客も部分保存しない" do
    allow(CustomerCreationRequest).to receive(:create!).and_raise("history unavailable")
    expect {
      expect { Customers::IdempotentCreator.call(attributes: attributes, current_staff: login_staff, key: key) }.to raise_error("history unavailable")
    }.not_to change(Customer, :count)
  end
end
