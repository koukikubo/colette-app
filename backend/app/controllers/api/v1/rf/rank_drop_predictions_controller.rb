class Api::V1::Rf::RankDropPredictionsController <
  Api::V1::BaseController
  include ApiPagination

  class InvalidParameterError < StandardError; end

  # 日単位で予測するため、無制限に長い期間を指定させない。
  MAX_PREDICTION_DAYS = 366
  PER_PAGE_OPTIONS = [ 20, 50, 100 ].freeze

  rescue_from InvalidParameterError,
              with: :render_invalid_parameter

  def show
    # 共通Concernで、ページ番号と表示件数を検証する。
    paging = pagination_params
    return if performed?

    unless PER_PAGE_OPTIONS.include?(paging.fetch(:per_page))
      raise InvalidParameterError,
            "表示件数は20・50・100件から選択してください"
    end

    # リクエスト内で基準日を固定する。
    # 処理中に日付が変わっても、条件と表示がずれないようにする。
    base_date = Time.zone.today
    until_date = prediction_until_date(base_date)

    current_run = RfSetting.first&.current_calculation_run

    # 履歴がない状態を「予測した結果0人」と区別する。
    if current_run.nil?
      return render_success(
        data: {
          state: "no_current_run",
          base_date: base_date,
          until_date: until_date,
          current_run: nil,
          pagination: {
            current_page: paging.fetch(:page),
            per_page: paging.fetch(:per_page),
            total_count: nil,
            total_pages: nil
          },
          customers: []
        }
      )
    end

    # 公開中ルールではなく、現在の適用結果に対応するルールを使用する。
    rows = ::Rf::RankDropPredictionList.call(
      rule_set: current_run.rf_rule_set,
      base_date: base_date,
      until_date: until_date
    )

    page = paging.fetch(:page)
    per_page = paging.fetch(:per_page)
    total_count = rows.size

    # 一覧サービスの戻り値はArray。
    # Relation用のpaginateは使用せず、並び替え後の結果を切り出す。
    selected_rows = rows.slice((page - 1) * per_page, per_page) || []

    render_success(
      data: {
        state: "ready",
        base_date: base_date,
        until_date: until_date,

        # ルールの選択元を示す情報。
        # 予測の基準日はこの履歴の日付ではなく、上記base_date。
        current_run: {
          id: current_run.id,
          base_date: current_run.base_date,
          rule_set_id: current_run.rf_rule_set_id
        },

        pagination: {
          current_page: page,
          per_page: per_page,
          total_count: total_count,
          total_pages: (total_count.to_f / per_page).ceil
        },

        customers: selected_rows.map { |row| serialize_row(row) }
      }
    )
  end

  private

  # 予測期限を日付へ変換し、計算できる期間か検証する。
  def prediction_until_date(base_date)
    value = params[:until_date]

    # 未指定なら今日から3か月後まで予測する。
    until_date =
      if value.blank?
        base_date.advance(months: 3)
      else
        # Date.iso8601だけに任せず、APIで受け付ける形式も固定する。
        unless value.is_a?(String) &&
               value.match?(/\A\d{4}-\d{2}-\d{2}\z/)
          raise InvalidParameterError,
                "予測期限はYYYY-MM-DD形式で指定してください"
        end

        Date.iso8601(value)
      end

    if until_date <= base_date
      raise InvalidParameterError,
            "予測期限は今日より後を指定してください"
    end

    # 日ごとに計算するため、極端に長い期間を受け付けない。
    if until_date > base_date + MAX_PREDICTION_DAYS
      raise InvalidParameterError,
            "予測期限は今日から#{MAX_PREDICTION_DAYS}日以内を指定してください"
    end

    until_date
  rescue Date::Error
    # 2026-02-30など、形式が正しくても存在しない日付を拒否する。
    raise InvalidParameterError,
          "予測期限には存在する日付を指定してください"
  end

  # サービスの戻り値を、フロントエンドへ返すJSONの項目に変換する。
  # モデル全体を返さず、一覧に必要な情報だけを公開する。
  def serialize_row(row)
    customer = row.customer
    prediction = row.prediction

    {
      customer_id: customer.id,
      customer_name: display_name(customer),
      predicted_drop_on: prediction.predicted_drop_on,
      days_until_drop: prediction.days_until_drop,

      # 保存済みの適用ランクではなく、
      # 予測基準日の履歴から再計算したランク。
      current_rank: serialize_rank(prediction.current_rank),
      predicted_rank: serialize_rank(prediction.predicted_rank)
    }
  end

  # 既存の低下済み一覧と同様に、法人は法人名を優先する。
  def display_name(customer)
    if customer.customer_kind == "corporate"
      customer.company_name.presence || customer.name
    else
      customer.name
    end
  end

  # 表示名・色と、昇降判定で使用した順位を返す。
  # 旧コードではなく、現在のRFランク表示コードを使用する。
  def serialize_rank(rank)
    {
      id: rank.id,
      display_code: rank.display_code,
      label: rank.label,
      display_color: rank.display_color,
      position: rank.position
    }
  end

  # 入力の誤りは、サーバー内部の不具合と区別して400で返す。
  def render_invalid_parameter(error)
    render_error(
      message: "予測条件が不正です",
      errors: [ error.message ],
      status: :bad_request
    )
  end
end
