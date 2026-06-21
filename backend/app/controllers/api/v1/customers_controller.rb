class Api::V1::CustomersController < Api::V1::BaseController
  wrap_parameters false
  
  VISIBILITIES = %w[visible hidden all].freeze
  CUSTOMER_KINDS = %w[individual corporate].freeze

  before_action :require_staff_login!
  before_action :set_customer,
                only: %i[show update hidden restore]

  rescue_from ActiveRecord::StaleObjectError,
              with: :render_stale_object_error

  def index
    visibility = params[:visibility].presence || "visible"
    customer_kind = params[:customer_kind].presence

    return unless valid_visibility?(visibility)
    return unless valid_customer_kind?(customer_kind)

    customers = Customer.includes(
      created_by_staff: :staff_master,
      updated_by_staff: :staff_master
    )

    customers = filter_by_visibility(customers, visibility)
    customers = customers.where(customer_kind: customer_kind) if customer_kind
    customers = Customers::SearchQuery.new(
        relation: customers,
        keyword: params[:query]
      ).call
    customers = customers.order(id: :desc)

    render_success(
      data: {
        customers: customers.map do |customer|
          serialize_customer(customer)
        end
      }
    )
  end

  def show
    render_customer(@customer)
  end

  def create
    customer = Customer.new(customer_create_params)

    # クライアントから担当者IDを受け取らず、
    # 認証済みセッションの担当者を設定する。
    customer.created_by_staff = current_staff
    customer.updated_by_staff = current_staff

    if customer.save
      render_customer(customer, status: :created)
    else
      render_validation_error(customer)
    end
  end

  def update
    @customer.assign_attributes(customer_update_params)
    @customer.updated_by_staff = current_staff

    if @customer.save
      render_customer(@customer)
    else
      render_validation_error(@customer)
    end
  end

  def hidden
    @customer.lock_version = required_lock_version

    if @customer.hidden_at.present?
      return render_error(
        message: "顧客はすでに非表示です",
        status: :unprocessable_content
      )
    end

    @customer.hidden_at = Time.current
    @customer.updated_by_staff = current_staff

    if @customer.save
      render_customer(@customer)
    else
      render_validation_error(@customer)
    end
  end

  def restore
    @customer.lock_version = required_lock_version

    if @customer.hidden_at.nil?
      return render_error(
        message: "顧客はすでに表示中です",
        status: :unprocessable_content
      )
    end

    @customer.hidden_at = nil
    @customer.updated_by_staff = current_staff

    if @customer.save
      render_customer(@customer)
    else
      render_validation_error(@customer)
    end
  end

  private

  def set_customer
    @customer = Customer
      .includes(
        created_by_staff: :staff_master,
        updated_by_staff: :staff_master
      )
      .find(params[:id])
  end

  def customer_create_params
    params.expect(
      customer: customer_attributes
    )
  end

  def customer_update_params
    permitted_params = params.expect(
      customer: customer_attributes + [:lock_version]
    )

    if permitted_params[:lock_version].nil?
      raise ActionController::ParameterMissing.new(:lock_version)
    end

    permitted_params
  end

  def customer_attributes
    %i[
      customer_kind
      name
      kana
      postal_code
      address
      phone_number
      email
      birthday
      company_name
      company_name_kana
      company_postal_code
      company_address
      company_phone_number
      company_email
      memo
    ]
  end

  def required_lock_version
    permitted_params = params.expect(
      customer: [:lock_version]
    )

    lock_version = permitted_params[:lock_version]

    if lock_version.nil?
      raise ActionController::ParameterMissing.new(:lock_version)
    end

    lock_version
  end

  def valid_visibility?(visibility)
    return true if VISIBILITIES.include?(visibility)

    render_error(
      message: "表示条件が不正です",
      errors: [
        "visibilityにはvisible、hidden、allのいずれかを指定してください"
      ],
      status: :bad_request
    )

    false
  end

  def valid_customer_kind?(customer_kind)
    return true if customer_kind.nil?
    return true if CUSTOMER_KINDS.include?(customer_kind)

    render_error(
      message: "顧客区分が不正です",
      errors: [
        "customer_kindにはindividualまたはcorporateを指定してください"
      ],
      status: :bad_request
    )

    false
  end

  def filter_by_visibility(customers, visibility)
    case visibility
    when "visible"
      customers.where(hidden_at: nil)
    when "hidden"
      customers.where.not(hidden_at: nil)
    when "all"
      customers
    end
  end

  def filter_by_keyword(customers)
    keyword = params[:query].to_s.strip
    return customers if keyword.blank?

    escaped_keyword = ActiveRecord::Base.sanitize_sql_like(keyword)
    partial_keyword = "%#{escaped_keyword}%"
    phone_keyword = keyword.gsub(/\D/, "")

    conditions = <<~SQL.squish
      customers.name ILIKE :keyword
      OR customers.kana ILIKE :keyword
      OR customers.email ILIKE :keyword
      OR customers.company_name ILIKE :keyword
      OR customers.company_name_kana ILIKE :keyword
      OR customers.company_email ILIKE :keyword
    SQL

    bind_values = {
      keyword: partial_keyword
    }

    if phone_keyword.present?
      conditions = <<~SQL.squish
        #{conditions}
        OR customers.phone_number LIKE :phone_keyword
        OR customers.company_phone_number LIKE :phone_keyword
      SQL

      bind_values[:phone_keyword] = "%#{phone_keyword}%"
    end

    customers.where(conditions, bind_values)
  end

  def serialize_customer(customer)
    Api::V1::CustomerSerializer
      .new(customer)
      .as_json
  end

  def render_customer(customer, status: :ok)
    render_success(
      data: {
        customer: serialize_customer(customer)
      },
      status: status
    )
  end

  def render_validation_error(customer)
    render_error(
      message: "入力内容に誤りがあります",
      errors: customer.errors.full_messages,
      status: :unprocessable_content
    )
  end

  def render_stale_object_error(_error)
    render_error(
      message: "顧客情報は別の担当者によって更新されています",
      errors: [
        "最新の顧客情報を再取得してから、もう一度操作してください"
      ],
      status: :conflict
    )
  end
end