module Rf
  # 複数顧客のRFランク低下予定を求め、予定日の近い順に返す。
  #
  # 対象：
  # - 非表示ではない顧客
  # - 手動顧客ランクによるRF計算対象外ではない顧客
  #
  # 前提：
  # - 基準日以降に来店しない
  # - 指定されたRFルールを予測期間中も使用する
  #
  # 読み取り専用。現在の適用ランクや計算履歴は更新しない。
  class RankDropPredictionList
    # 一覧の1行分。
    # 顧客情報と、低下予定日・変更前後のランクを持つ予測結果を組み合わせる。
    Row = Struct.new(
      :customer,
      :prediction,
      keyword_init: true
    )

    # 呼び出し元からルールと予測期間を受け取る入口。
    def self.call(rule_set:, base_date:, until_date:)
      new(
        rule_set: rule_set,
        base_date: base_date,
        until_date: until_date
      ).call
    end

    def initialize(rule_set:, base_date:, until_date:)
      @rule_set = rule_set

      # 日付単位で予測するため、受け取った値をDateにそろえる。
      @base_date = base_date.to_date
      @until_date = until_date.to_date
    end

    def call
      # 顧客が0件でも不正な期間を受け付けないよう、先に検証する。
      validate_period!

      # 日付・顧客ごとの計算で、同じルールを繰り返し取得しないようにする。
      preload_rules!

      rows = []

      # 顧客と来店履歴を全件まとめて読み込まず、100人ずつ処理する。
      target_customers.find_in_batches(batch_size: 100) do |customers|
        # 非表示の顧客は取得時に除外済み。
        # ここでは手動顧客ランクによるRF計算対象外を除く。
        eligible_customers =
          customers.reject(&:excluded_from_rf_calculation?)

        next if eligible_customers.empty?

        # 顧客ごとの問い合わせを避け、バッチ内の来店履歴をまとめて取得する。
        visits = visit_dates_by_customer_id(eligible_customers)

        eligible_customers.each do |customer|
          # 1人分の「初めてランクが下がる日」の探索は専用サービスに任せる。
          # 履歴がない場合は空配列を渡し、未訪問として判定させる。
          prediction = CustomerRankDropPredictor.call(
            customer: customer,
            rule_set: rule_set,
            base_date: base_date,
            until_date: until_date,
            visit_dates: visits.fetch(customer.id, [])
          )

          # 期限内に通常ランクの低下がない顧客は一覧に含めない。
          next if prediction.nil?

          rows << Row.new(
            customer: customer,
            prediction: prediction
          )
        end
      end

      # 対応が必要になる日付の近い順に並べる。
      # 同日の場合も順序が安定するよう、顧客IDを第2条件にする。
      rows.sort_by do |row|
        [
          row.prediction.predicted_drop_on,
          row.customer.id
        ]
      end
    end

    private

    attr_reader :rule_set, :base_date, :until_date

    def validate_period!
      return if until_date > base_date

      raise ArgumentError, "予測期限は基準日より後を指定してください"
    end

    def preload_rules!
      rule_set.recency_rules.load
      rule_set.frequency_rules.load

      # CustomerRankCalculatorは、読み込み済みの対応表をメモリ上で検索する。
      # 対応するランクも一緒に読み込み、ランク取得の追加問い合わせを防ぐ。
      rule_set.rank_mappings.includes(:rf_rank).load
    end

    def target_customers
      # 通常のRF計算と同じく、非表示の顧客を対象から除く。
      # customer_rankはRF計算対象外の判定で使用するため先に取得する。
      Customer
        .where(hidden_at: nil)
        .includes(:customer_rank)
    end

    def visit_dates_by_customer_id(customers)
      # 顧客IDをキー、来店日の配列を値として保持する。
      dates = Hash.new { |hash, id| hash[id] = [] }

      # 実際の来店として、完了済み・未キャンセルの予約だけを使う。
      # 基準日より後や、集計期間より前の予約は取得しない。
      Reservation
        .where(customer_id: customers.map(&:id))
        .where.not(completed_at: nil)
        .where(canceled_at: nil)
        .where(starts_at: aggregation_period)
        .pluck(:customer_id, :starts_at)
        .each do |customer_id, starts_at|
          # 店舗タイムゾーンで来店日へ変換する。
          # 同日に複数回来店した場合も、既存の回数計算に合わせて保持する。
          dates[customer_id] << starts_at.in_time_zone.to_date
        end

      dates
    end

    def aggregation_period
      first_date =
        base_date.advance(months: -rule_set.aggregation_months)

      # 集計開始日の0時を含み、基準日の翌日0時は含まない。
      # 将来の予測では集計開始日が後ろへ進むため、
      # 基準日時点の集計期間より古い履歴を追加取得する必要はない。
      first_date.beginning_of_day...
        base_date.next_day.beginning_of_day
    end
  end
end
