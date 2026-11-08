module Rf
  # 指定期間内にRFランクが低下した顧客を抽出し、ページ単位で返す。
  #
  # 呼び出し元：Api::V1::Rf::RankDropsController
  # 使用する既存処理：
  # - AppliedRunHistory：現在適用中の結果につながる履歴を取得
  # - RunPopulationRowBuilder：計算履歴のランク情報を取得
  # - RankMovementClassifier：上昇・下降・維持を判定
  #
  # 読み取り専用。顧客ランクや適用中の計算結果は変更しない。
  class RankDropSummary
    class InvalidParameterError < StandardError; end

    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100
    PER_PAGE_OPTIONS = [ 20, 50, 100 ].freeze

    # コントローラーから呼ぶ入口。
    # newで処理用オブジェクトを作り、そのオブジェクトのcallを実行する。
    def self.call(
      current_run:,
      start_date: nil,
      end_date: nil,
      page: nil,
      per_page: nil
    )
      new(
        current_run: current_run,
        start_date: start_date,
        end_date: end_date,
        page: page,
        per_page: per_page
      ).call
    end

    # 引数を保存し、日付やページ番号を処理で使える型へ変換する。
    # URLのクエリパラメーターは文字列なので、ここで形式も検証する。
    def initialize(current_run:, start_date:, end_date:, page:, per_page:)
      @current_run = current_run
      @start_date = parse_date(
        start_date,
        default: Date.current.beginning_of_month
      )
      @end_date = parse_date(end_date, default: Date.current)
      @page = parse_positive_integer(page, default: 1)
      @per_page = parse_per_page(per_page)
      @skipped_comparisons = []
    end

    # 処理全体の進行を担当する。
    # 履歴なし・比較不能・対象者0人を、それぞれ異なる状態で返す。
    def call
      validate_period!

      return build_response(state: :no_current_run) if current_run.nil?

      validate_completed!(current_run)

      period_runs = runs_in_period

      if period_runs.empty?
        return build_response(state: :no_history_in_period)
      end

      comparable_runs = select_comparable_runs(period_runs)

      if comparable_runs.empty?
        state =
          if period_runs.all? { |run| run.previous_run.nil? }
            :no_previous_run
          else
            :no_comparable_history
          end

        return build_response(state: state)
      end

      events = collect_latest_drop_events(comparable_runs)
      customer_ids = visible_customer_ids(events)

      build_response(
        state: :ready,
        events: events,
        customer_ids: customer_ids
      )
    end

    private

    attr_reader :current_run, :start_date, :end_date,
                :page, :per_page, :skipped_comparisons

    # YYYY-MM-DD形式の文字列をDateへ変換する。
    # 未指定の場合だけ初期値を使い、不正な入力を黙って置き換えない。
    def parse_date(value, default:)
      return default if value.nil?

      unless value.to_s.match?(/\A\d{4}-\d{2}-\d{2}\z/)
        raise InvalidParameterError, "日付はYYYY-MM-DD形式で指定してください"
      end

      Date.iso8601(value.to_s)
    rescue Date::Error
      raise InvalidParameterError, "存在する日付を指定してください"
    end

    # ページ番号・件数を正の整数へ変換する。
    # 1ページの件数には上限を設け、一度に大量の顧客情報を返さない。
    def parse_positive_integer(value, default:, maximum: nil)
      return default if value.nil?

      unless value.to_s.match?(/\A[1-9]\d*\z/)
        raise InvalidParameterError, "ページ番号と表示件数は正の整数で指定してください"
      end

      number = Integer(value.to_s, 10)

      if maximum && number > maximum
        raise InvalidParameterError,
              "1ページの表示件数は#{maximum}件以下で指定してください"
      end

      number
    end

    # 期間の前後関係と、未来日が指定されていないことを確認する。
    # このサービスは実績の比較であり、将来のランク予測は行わない。
    def validate_period!
      if start_date > end_date
        raise InvalidParameterError, "開始日は終了日以前にしてください"
      end

      return if end_date <= Date.current

      raise InvalidParameterError, "終了日は今日以前にしてください"
    end

    # 未完了の履歴を使った比較を防ぐ。
    # 不完全な履歴は「対象者0人」ではなく、データのエラーとして扱う。
    def validate_completed!(run)
      return if run.status == "completed"

      raise RunPopulationSummary::IncompleteRunError,
            "完了していないRF計算結果は比較できません"
    end

    # 現在適用中の結果につながる履歴から、期間内の計算を選ぶ。
    # 期間初日の低下判定には、その直前の履歴も必要になるため、
    # previous_run側には期間の制限をかけない。
    def runs_in_period
      AppliedRunHistory
        .call(current_run: current_run)
        .select { |run| run.base_date.between?(start_date, end_date) }
    end

    # 同じRFルールで、日付が逆転していない履歴だけを比較対象にする。
    # 比較を省略した理由はレスポンスに残し、全件比較できたと誤認させない。
    def select_comparable_runs(runs)
      runs.select do |run|
        previous_run = run.previous_run

        reason =
          if previous_run.nil?
            :no_previous_run
          elsif run.rf_rule_set_id != previous_run.rf_rule_set_id
            :rule_set_changed
          elsif previous_run.base_date > run.base_date
            :base_date_reversed
          end

        if reason
          skipped_comparisons << {
            run_id: run.id,
            base_date: run.base_date,
            reason: reason
          }
          next false
        end

        validate_completed!(run)
        validate_completed!(previous_run)
        true
      end
    end

    # 履歴に保存されたランク情報を、IDで取り出せる形に変換する。
    # 既存の履歴表示処理を再利用し、表示名と順位の扱いを統一する。
    def ranks_for(run)
      RunPopulationRowBuilder
        .call(calculation_run: run)
        .fetch(:ranks)
        .index_by { |rank| rank.fetch(:id) }
    end

    # 比較に必要な列だけを取得し、顧客IDをキーにして整理する。
    # この段階では顧客名・連絡先などの顧客情報を読み込まない。
    def results_for(run)
      run.customer_rf_rank_results
        .pluck(:customer_id, :rf_rank_id, :exclusion_reason, :last_visit_on)
        .each_with_object({}) do |(customer_id, rank_id, reason, last_visit_on), results|
          results[customer_id] = {
            rank_id: rank_id,
            exclusion_reason: reason,
            last_visit_on: last_visit_on
          }
        end
    end

    # 記録が通常ランクに属するか確認する。
    # 記録なし・対象外・未分類・来店履歴なしは、通常の低下判定から外す。
    def regular_result?(result, run)
      return false if result.nil?
      return false if result.fetch(:exclusion_reason).present?
      return false if result.fetch(:rank_id).nil?

      result.fetch(:rank_id) != run.rf_rule_set.no_visit_rank_id
    end

    # 期間内の各履歴で低下を検出し、顧客ごとに最新の1件を保持する。
    # 翌日に維持・上昇しても、この期間内の低下記録は消さない。
    # 同じ基準日の複数計算は、履歴IDが大きい方を新しいものとして扱う。
    def collect_latest_drop_events(runs)
      runs
        .sort_by { |run| [ run.base_date, run.id ] }
        .each_with_object({}) do |run, events|
          drop_events_for(run).each do |event|
            events[event.fetch(:customer_id)] = event
          end
        end
    end

    # 1つの計算履歴とprevious_runを比較し、低下した顧客だけを返す。
    # 判定は既存のRankMovementClassifierへ委譲する。
    def drop_events_for(run)
      previous_run = run.previous_run
      previous_ranks = ranks_for(previous_run)
      current_ranks = ranks_for(run)
      previous_results = results_for(previous_run)

      results_for(run).filter_map do |customer_id, result|
        previous_result = previous_results[customer_id]

        next unless regular_result?(previous_result, previous_run)
        next unless regular_result?(result, run)

        previous_rank = previous_ranks.fetch(previous_result.fetch(:rank_id))
        dropped_rank = current_ranks.fetch(result.fetch(:rank_id))

        movement = RankMovementClassifier.call(
          previous_rank: previous_rank,
          current_rank: dropped_rank
        )

        next unless movement == :down

        {
          customer_id: customer_id,
          detected_on: run.base_date,
          calculation_run_id: run.id,
          comparison_run_id: previous_run.id,
          previous_rank: previous_rank.except(:count),
          dropped_rank: dropped_rank.except(:count)
        }
      end
    end

    # 現在非表示の顧客を外し、最新の低下日から順に並べる。
    # 同日の場合は顧客ID順にして、ページごとの並びを安定させる。
    def visible_customer_ids(events)
      visible_ids = Customer
        .where(id: events.keys, hidden_at: nil)
        .pluck(:id)
        .index_with { true }

      events.values
        .select { |event| visible_ids.key?(event.fetch(:customer_id)) }
        .sort_by do |event|
          [ -event.fetch(:detected_on).jd, event.fetch(:customer_id) ]
        end
        .map { |event| event.fetch(:customer_id) }
    end

    # ページに表示する顧客だけ、適用中の計算結果を取得する。
    # 低下時点のランクと、その後に回復した現在のランクを区別するために使う。
    def latest_results_for(customer_ids)
      current_run.customer_rf_rank_results
        .where(customer_id: customer_ids)
        .index_by(&:customer_id)
    end

    # 現在の計算結果が通常ランクか、特殊区分かを返す。
    # 特殊区分を現在ランクのラベルだけで表現して誤解させない。
    def latest_state_for(result)
      return :missing if result.nil?

      case result.exclusion_reason
      when "manual_customer_rank"
        :excluded
      when "no_matching_rule"
        :unmatched
      else
        return :unmatched if result.rf_rank_id.nil?

        if result.rf_rank_id == current_run.rf_rule_set.no_visit_rank_id
          :no_visit
        else
          :ranked
        end
      end
    end

    # 指定ページの顧客情報をまとめて取得し、表示用データを作る。
    # 顧客ごとの個別検索を避け、名前の取得をページ内の人数に限定する。
    def page_customers(events, customer_ids)
      offset = (page - 1) * per_page
      selected_ids = customer_ids.slice(offset, per_page) || []
      return [] if selected_ids.empty?

      customers = Customer
        .where(id: selected_ids)
        .select(:id, :name, :company_name, :customer_kind)
        .index_by(&:id)
      latest_results = latest_results_for(selected_ids)
      latest_ranks = ranks_for(current_run)

      selected_ids.map do |customer_id|
        customer = customers.fetch(customer_id)
        result = latest_results[customer_id]
        state = latest_state_for(result)

        events.fetch(customer_id).merge(
          customer_name: display_name(customer),
          latest_state: state,
          latest_rank:
            state == :ranked ? latest_ranks.fetch(result.rf_rank_id).except(:count) : nil,
          last_visit_on: result&.last_visit_on
        )
      end
    end

    # 法人顧客は法人名、個人顧客は氏名を表示する。
    # 法人名がない既存データの場合は氏名へ戻す。
    def display_name(customer)
      if customer.customer_kind == "corporate"
        customer.company_name.presence || customer.name
      else
        customer.name
      end
    end

    # 比較した期間・データの基準日・ページ情報を共通形式にまとめる。
    # 比較不能時の件数はnilとし、比較した結果の0人と区別する。
    def build_response(state:, events: {}, customer_ids: [])
      total_count = state == :ready ? customer_ids.size : nil

      {
        state: state,
        start_date: start_date,
        end_date: end_date,
        current_run:
          current_run && {
            id: current_run.id,
            base_date: current_run.base_date,
            rule_set_id: current_run.rf_rule_set_id
          },
        skipped_comparisons: skipped_comparisons,
        pagination: {
          current_page: page,
          per_page: per_page,
          total_count: total_count,
          total_pages:
            total_count && (total_count.to_f / per_page).ceil
        },
        customers:
          state == :ready ? page_customers(events, customer_ids) : []
      }
    end

    # 顧客一覧のUIと同じ、20・50・100件だけを受け付ける。
    # 正の整数かどうかの検証は既存メソッドへ委譲する。
    def parse_per_page(value)
      number = parse_positive_integer(
        value,
        default: DEFAULT_PER_PAGE,
        maximum: MAX_PER_PAGE
      )

      unless PER_PAGE_OPTIONS.include?(number)
        raise InvalidParameterError,
              "表示件数は20・50・100件から選択してください"
      end

      number
      end
  end
end
